import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedError } from '../../src/lib/errors.js';

const dbMock = {
  refreshToken: { findUnique: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  teacher: { findUnique: vi.fn() },
  student: { findUnique: vi.fn() },
};
vi.mock('../../src/lib/db.js', () => ({ db: dbMock }));

const { refreshTokens } = await import('../../src/modules/auth/auth.service.js');
const { signRefreshToken } = await import('../../src/services/tokenService.js');

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.refreshToken.findUnique.mockResolvedValue({
    id: 'r1', teacherId: 't1', studentId: null, revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  });
  dbMock.teacher.findUnique.mockResolvedValue({ id: 't1', name: 'T', tenantId: 'ten' });
});

describe('refreshTokens rotation', () => {
  it('rotates when the atomic revoke wins', async () => {
    dbMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    const res = await refreshTokens({ refreshToken: signRefreshToken({ sub: 't1' }) });
    expect(res.user.id).toBe('t1');
    expect(dbMock.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'r1', revokedAt: null } }),
    );
    expect(dbMock.refreshToken.create).toHaveBeenCalled();
  });

  it('rejects the losing parallel refresh and issues no new token', async () => {
    dbMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      refreshTokens({ refreshToken: signRefreshToken({ sub: 't1' }) }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(dbMock.refreshToken.create).not.toHaveBeenCalled();
  });
});
