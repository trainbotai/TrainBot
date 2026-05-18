import { db } from '../../lib/db.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../lib/errors.js';
import { storeImage, deleteImage, absolutePathOf } from './image.storage.js';

export async function uploadImage(opts: {
  studentId: string;
  projectId: string;
  labelId: string;
  clientId: string;
  buffer: Buffer;
}) {
  const label = await db.mLLabel.findUnique({
    where: { id: opts.labelId },
    include: { project: { select: { studentId: true, id: true } } },
  });
  if (!label || label.projectId !== opts.projectId) throw new NotFoundError('label');
  if (label.project.studentId !== opts.studentId) throw new ForbiddenError('Not your label');

  if (!opts.clientId) throw new BadRequestError('clientId required');

  // Idempotent: if already uploaded with this clientId, return existing
  const existing = await db.mLImage.findUnique({
    where: { labelId_clientId: { labelId: opts.labelId, clientId: opts.clientId } },
  });
  if (existing) return existing;

  // Generate cuid via Prisma create flow — we need ID first to name the file
  const placeholder = await db.mLImage.create({
    data: {
      labelId: opts.labelId,
      clientId: opts.clientId,
      filename: 'pending',
      sizeBytes: 0,
    },
  });

  try {
    const stored = await storeImage({
      labelId: opts.labelId,
      imageId: placeholder.id,
      buffer: opts.buffer,
    });
    const updated = await db.mLImage.update({
      where: { id: placeholder.id },
      data: {
        filename: stored.filename,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
      },
    });
    return updated;
  } catch (err) {
    // Cleanup DB row if file write failed
    await db.mLImage.delete({ where: { id: placeholder.id } }).catch(() => undefined);
    throw err;
  }
}

export async function deleteImageById(opts: {
  studentId: string;
  imageId: string;
}) {
  const image = await db.mLImage.findUnique({
    where: { id: opts.imageId },
    include: { label: { include: { project: { select: { studentId: true } } } } },
  });
  if (!image) throw new NotFoundError('image');
  if (image.label.project.studentId !== opts.studentId) {
    throw new ForbiddenError('Not your image');
  }

  await deleteImage(image.filename);
  await db.mLImage.delete({ where: { id: opts.imageId } });
}

/**
 * Resolve image for serving. Allows:
 * - Owner student
 * - Any teacher in the same tenant whose class contains the student
 * Returns absolute file path to be sent.
 */
export async function resolveImageForServing(opts: {
  imageId: string;
  requesterId: string;
  requesterRole: 'student' | 'teacher';
  tenantId: string;
}): Promise<{ absolutePath: string; sizeBytes: number }> {
  const image = await db.mLImage.findUnique({
    where: { id: opts.imageId },
    include: {
      label: {
        include: {
          project: {
            include: {
              student: { select: { id: true, tenantId: true, class: { select: { teacherId: true } } } },
            },
          },
        },
      },
    },
  });
  if (!image) throw new NotFoundError('image');

  const student = image.label.project.student;
  if (student.tenantId !== opts.tenantId) throw new NotFoundError('image');

  const isOwner = opts.requesterRole === 'student' && student.id === opts.requesterId;
  const isClassTeacher =
    opts.requesterRole === 'teacher' && student.class.teacherId === opts.requesterId;

  if (!isOwner && !isClassTeacher) throw new ForbiddenError('Cannot view this image');

  return {
    absolutePath: absolutePathOf(image.filename),
    sizeBytes: image.sizeBytes,
  };
}
