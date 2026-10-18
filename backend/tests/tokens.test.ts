import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { hashToken, signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../src/lib/tokens.js';

describe('tokens JWT', () => {
  it('assina e valida o access token com o papel do usuário', () => {
    const token = signAccessToken({ sub: 'u1', role: 'MODERATOR', name: 'Ana' });
    expect(verifyAccessToken(token)).toMatchObject({ sub: 'u1', role: 'MODERATOR', name: 'Ana' });
  });

  it('não aceita refresh token no lugar do access token (segredos diferentes)', () => {
    const refresh = signRefreshToken('u1');
    expect(() => verifyAccessToken(refresh)).toThrow(jwt.JsonWebTokenError);
    expect(verifyRefreshToken(refresh).sub).toBe('u1');
  });

  it('cada refresh token é único e o hash é determinístico', () => {
    const a = signRefreshToken('u1');
    const b = signRefreshToken('u1');
    expect(a).not.toBe(b);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).toHaveLength(64);
  });
});
