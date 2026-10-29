import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../src/modules/ml/image.service.js', () => ({ uploadImage: vi.fn().mockResolvedValue({ id: 'i' }) }));
const { uploadImage } = await import('../../src/modules/ml/image.controller.js');

async function run(clientId: unknown) {
  const req = {
    auth: { role: 'student', userId: 's', tenantId: 't' },
    file: { buffer: Buffer.from('x') },
    body: { clientId },
    params: { projectId: 'p', labelId: 'l' },
  } as unknown as Request;
  const res = { status: () => ({ json: () => undefined }) } as unknown as Response;
  const next = vi.fn();
  await uploadImage(req, res, next);
  return next;
}

describe('uploadImage clientId validation', () => {
  it('accepts a UUID', async () => {
    expect(await run('123e4567-e89b-12d3-a456-426614174000')).not.toHaveBeenCalled();
  });
  it.each([['a'.repeat(65)], ['bad id!'], [''], [undefined], [42]])('rejects %s', async (v) => {
    expect(await run(v)).toHaveBeenCalledOnce();
  });
});
