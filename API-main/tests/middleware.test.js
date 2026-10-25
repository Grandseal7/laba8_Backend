
import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../middleware/auth.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-only-for-local-tests';

function createResponse() {
  return {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.body = data;
      return this;
    },
  };
}

describe('Middleware: requireRole', () => {
  it('разрешает доступ пользователю с нужной ролью', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = createResponse();
    const next = vi.fn();

    requireRole('admin')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('возвращает 403 при неправильной роли', () => {
    const req = { user: { id: 2, role: 'user' } };
    const res = createResponse();
    const next = vi.fn();

    requireRole('admin')(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error: 'Недостаточно прав',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Middleware: requireAuth', () => {
  it('возвращает 401, если токен отсутствует', () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: 'Требуется вход в систему',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('пропускает запрос с действительным JWT', () => {
    const token = jwt.sign(
      { sub: '1', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({
      id: 1,
      role: 'admin',
    });
  });

  it('возвращает 401 и сообщает об истёкшем токене', () => {
    const token = jwt.sign(
      { sub: '1', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '-1s' },
    );

    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/истёк/i);
    expect(next).not.toHaveBeenCalled();
  });
});
