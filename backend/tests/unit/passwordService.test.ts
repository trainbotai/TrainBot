import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/services/passwordService.js';

describe('passwordService', () => {
  it('hashPassword produces a string different from the input', async () => {
    const hash = await hashPassword('hunter2');
    expect(hash).not.toBe('hunter2');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifyPassword returns true for the correct password', async () => {
    const hash = await hashPassword('hunter2');
    expect(await verifyPassword('hunter2', hash)).toBe(true);
  });

  it('verifyPassword returns false for the wrong password', async () => {
    const hash = await hashPassword('hunter2');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('two hashes of the same password are different (salt)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });
});
