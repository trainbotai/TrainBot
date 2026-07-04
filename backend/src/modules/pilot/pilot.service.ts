import { db } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';

export async function createPilotRequest(opts: {
  name: string;
  school: string;
  email: string;
  message?: string;
  locale?: string;
}) {
  const created = await db.pilotRequest.create({
    data: {
      name: opts.name,
      school: opts.school,
      email: opts.email,
      message: opts.message ?? null,
      locale: opts.locale ?? null,
    },
  });
  logger.info({ pilotRequestId: created.id, school: created.school }, 'pilot request received');
  return { id: created.id };
}
