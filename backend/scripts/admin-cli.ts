import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { db } from '../src/lib/db.js';
import { hashPassword } from '../src/services/passwordService.js';

async function ask(rl: readline.Interface, prompt: string, hidden = false): Promise<string> {
  if (!hidden) return rl.question(prompt);
  process.stdout.write(prompt);
  return new Promise((resolve) => {
    let buffer = '';
    const onData = (data: Buffer) => {
      const ch = data.toString('utf8');
      if (ch === '\n' || ch === '\r' || ch === '\r\n') {
        process.stdin.removeListener('data', onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        resolve(buffer);
      } else if (ch === '') {
        process.exit(0);
      } else if (ch === '') {
        buffer = buffer.slice(0, -1);
      } else {
        buffer += ch;
      }
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

async function createTenantAndAdmin() {
  const rl = readline.createInterface({ input, output });

  console.log('=== Create new tenant + admin teacher ===\n');
  const tenantName = await ask(rl, 'Tenant (school) name: ');
  const tenantSlug = await ask(rl, 'Tenant slug (lowercase, hyphens): ');
  const teacherName = await ask(rl, 'Admin teacher full name: ');
  const teacherEmail = await ask(rl, 'Admin teacher email: ');
  const teacherPassword = await ask(rl, 'Admin teacher password: ', true);

  rl.close();

  const passwordHash = await hashPassword(teacherPassword);

  const result = await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: tenantName, slug: tenantSlug },
    });
    const teacher = await tx.teacher.create({
      data: {
        tenantId: tenant.id,
        email: teacherEmail.toLowerCase(),
        passwordHash,
        name: teacherName,
        role: 'ADMIN',
      },
    });
    return { tenant, teacher };
  });

  console.log('\n✔ Created successfully:');
  console.log(`  Tenant: ${result.tenant.name} (${result.tenant.id})`);
  console.log(`  Teacher: ${result.teacher.name} <${result.teacher.email}> (${result.teacher.id})`);
}

async function listTenants() {
  const tenants = await db.tenant.findMany({
    include: { _count: { select: { teachers: true, classes: true } } },
    orderBy: { createdAt: 'desc' },
  });
  console.log('\n=== Tenants ===');
  for (const t of tenants) {
    console.log(
      `  [${t.slug}] ${t.name}  teachers=${t._count.teachers} classes=${t._count.classes}  (id=${t.id})`,
    );
  }
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === 'create-tenant') {
    await createTenantAndAdmin();
  } else if (cmd === 'list-tenants') {
    await listTenants();
  } else {
    console.log('Usage:');
    console.log('  npm run admin:cli -- create-tenant');
    console.log('  npm run admin:cli -- list-tenants');
    process.exit(1);
  }
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
