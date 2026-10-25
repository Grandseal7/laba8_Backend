
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

const uniqueEmail = () =>
  `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;

describe('POST /api/auth/register', () => {
  it('регистрирует пользователя и возвращает токен', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Тестовый пользователь',
        email: uniqueEmail(),
        password: 'TestPass123'
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.role).toBe('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).not.toHaveProperty('password_hash');
  });

  it('не позволяет назначить себе роль администратора', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Попытка стать админом',
        email: uniqueEmail(),
        password: 'TestPass123',
        role: 'admin'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('user');
  });

  it('отклоняет пароль короче 8 символов', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Короткий пароль',
        email: uniqueEmail(),
        password: '123'
      });

    expect(response.status).toBe(400);
  });

  it('приводит email к нижнему регистру', async () => {
    const email = uniqueEmail().toUpperCase();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Проверка email',
        email,
        password: 'TestPass123'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(email.toLowerCase());
  });

  it('возвращает 409 при повторной регистрации с тем же email', async () => {
    const email = uniqueEmail();

    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Первый пользователь',
        email,
        password: 'TestPass123'
      });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Повторный пользователь',
        email,
        password: 'TestPass123'
      });

    expect(response.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('позволяет администратору войти в систему', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('admin');
    expect(response.body).toHaveProperty('token');
    expect(response.body.token.split('.')).toHaveLength(3);
    expect(response.body.user).not.toHaveProperty('password_hash');
  });

  it('возвращает 401 при неверном пароле', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: 'WrongPassword123'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Неверный email или пароль');
  });
});

describe('GET /api/auth/me', () => {
  it('возвращает 401 без токена', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('возвращает данные вошедшего пользователя без хэша пароля', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Пользователь профиля',
        email: uniqueEmail(),
        password: 'TestPass123'
      });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
    expect(response.body).not.toHaveProperty('password_hash');
  });
});
