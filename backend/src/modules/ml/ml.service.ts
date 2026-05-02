import { db } from '../../lib/db.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
import type { SyncProjectBody } from './ml.schemas.js';

// Student: list own projects
export async function listOwnProjects(opts: { studentId: string; tenantId: string }) {
  return db.mLProject.findMany({
    where: { studentId: opts.studentId, tenantId: opts.tenantId },
    orderBy: { updatedAt: 'desc' },
    include: {
      labels: {
        select: { id: true, clientId: true, name: true, imageCount: true, updatedAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

// Student: upsert project (idempotent via clientId)
export async function syncProject(opts: {
  studentId: string;
  tenantId: string;
  body: SyncProjectBody;
}) {
  const { studentId, tenantId, body } = opts;

  return db.$transaction(async (tx) => {
    const project = await tx.mLProject.upsert({
      where: { studentId_clientId: { studentId, clientId: body.clientId } },
      update: {
        name: body.name,
        modelTrained: body.modelTrained ?? false,
        modelVersion: body.modelVersion ?? 0,
        trainedAt: body.trainedAt ? new Date(body.trainedAt) : null,
      },
      create: {
        tenantId,
        studentId,
        clientId: body.clientId,
        name: body.name,
        modelTrained: body.modelTrained ?? false,
        modelVersion: body.modelVersion ?? 0,
        trainedAt: body.trainedAt ? new Date(body.trainedAt) : null,
      },
    });

    const incomingClientIds = body.labels.map((l) => l.clientId);

    // Delete labels removed on client (replace-style sync)
    await tx.mLLabel.deleteMany({
      where: {
        projectId: project.id,
        ...(incomingClientIds.length > 0 ? { clientId: { notIn: incomingClientIds } } : {}),
      },
    });

    // Upsert each label
    for (const label of body.labels) {
      await tx.mLLabel.upsert({
        where: { projectId_clientId: { projectId: project.id, clientId: label.clientId } },
        update: { name: label.name, imageCount: label.imageCount },
        create: {
          projectId: project.id,
          clientId: label.clientId,
          name: label.name,
          imageCount: label.imageCount,
        },
      });
    }

    return tx.mLProject.findUniqueOrThrow({
      where: { id: project.id },
      include: {
        labels: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  });
}

// Student: delete own project
export async function deleteOwnProject(opts: {
  studentId: string;
  projectId: string;
}) {
  const project = await db.mLProject.findUnique({
    where: { id: opts.projectId },
    include: { labels: { include: { images: { select: { filename: true } } } } },
  });
  if (!project) throw new NotFoundError('project');
  if (project.studentId !== opts.studentId) {
    throw new ForbiddenError('Not your project');
  }
  const filesToDelete = project.labels.flatMap((l) => l.images.map((i) => i.filename));
  await db.mLProject.delete({ where: { id: opts.projectId } });
  // Best-effort disk cleanup (don't fail the API call if a file is missing)
  const { deleteImage } = await import('./image.storage.js');
  await Promise.all(filesToDelete.map((f) => deleteImage(f).catch(() => undefined)));
}

// Teacher: full detail page for one student (info + stats + projects with images)
export async function teacherStudentDetail(opts: {
  teacherId: string;
  tenantId: string;
  studentId: string;
}) {
  const student = await db.student.findFirst({
    where: {
      id: opts.studentId,
      tenantId: opts.tenantId,
      class: { teacherId: opts.teacherId },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      createdAt: true,
      lastSeenAt: true,
      class: { select: { id: true, code: true, name: true } },
    },
  });
  if (!student) throw new NotFoundError('student');

  const [projects, totalImages] = await Promise.all([
    db.mLProject.findMany({
      where: { studentId: opts.studentId },
      orderBy: { updatedAt: 'desc' },
      include: {
        labels: {
          select: {
            id: true,
            name: true,
            imageCount: true,
            images: { select: { id: true, createdAt: true }, take: 12, orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    db.mLImage.count({
      where: { label: { project: { studentId: opts.studentId } } },
    }),
  ]);

  const trainedCount = projects.filter((p) => p.modelTrained).length;
  const labelCount = projects.reduce((s, p) => s + p.labels.length, 0);

  return {
    student,
    stats: {
      projectCount: projects.length,
      trainedModelCount: trainedCount,
      labelCount,
      totalImages,
    },
    projects,
  };
}

// Teacher: list projects for one of their students (multi-tenant safe)
export async function teacherListStudentProjects(opts: {
  teacherId: string;
  tenantId: string;
  studentId: string;
}) {
  const student = await db.student.findFirst({
    where: {
      id: opts.studentId,
      tenantId: opts.tenantId,
      class: { teacherId: opts.teacherId },
    },
  });
  if (!student) throw new NotFoundError('student');

  return db.mLProject.findMany({
    where: { studentId: opts.studentId },
    orderBy: { updatedAt: 'desc' },
    include: {
      labels: {
        select: { id: true, name: true, imageCount: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

// Teacher: aggregated stats across all their classes
export async function teacherStats(opts: { teacherId: string; tenantId: string }) {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [classCount, studentCount, projectAgg, imagesIn24h, lastSync] = await Promise.all([
    db.class.count({
      where: { teacherId: opts.teacherId, tenantId: opts.tenantId, archivedAt: null },
    }),
    db.student.count({
      where: { tenantId: opts.tenantId, class: { teacherId: opts.teacherId, archivedAt: null } },
    }),
    db.mLProject.aggregate({
      where: { tenantId: opts.tenantId, student: { class: { teacherId: opts.teacherId } } },
      _count: { id: true },
    }),
    db.mLImage.count({
      where: {
        createdAt: { gte: since24h },
        label: {
          project: {
            tenantId: opts.tenantId,
            student: { class: { teacherId: opts.teacherId } },
          },
        },
      },
    }),
    db.mLProject.findFirst({
      where: { tenantId: opts.tenantId, student: { class: { teacherId: opts.teacherId } } },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true, student: { select: { username: true, displayName: true } } },
    }),
  ]);

  return {
    classCount,
    studentCount,
    projectCount: projectAgg._count.id,
    imagesLast24h: imagesIn24h,
    lastSync,
  };
}

// Teacher: list projects for entire class (aggregated overview)
export async function teacherListClassProjects(opts: {
  teacherId: string;
  tenantId: string;
  classId: string;
}) {
  const klass = await db.class.findFirst({
    where: { id: opts.classId, teacherId: opts.teacherId, tenantId: opts.tenantId },
  });
  if (!klass) throw new NotFoundError('class');

  return db.mLProject.findMany({
    where: { student: { classId: opts.classId } },
    orderBy: { updatedAt: 'desc' },
    include: {
      student: { select: { id: true, username: true, displayName: true } },
      labels: {
        select: {
          id: true,
          name: true,
          imageCount: true,
          // Up to 6 most recent image IDs per label (preview thumbnails for teacher)
          images: {
            select: { id: true },
            take: 6,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });
}
