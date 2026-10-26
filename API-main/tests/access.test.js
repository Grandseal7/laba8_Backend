
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

const uniqueEmail = () =>
  `access_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;

async function getUserToken() {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Обычный пользователь',
      email: uniqueEmail(),
      password: 'TestPass123'
    });

  return response.body.token;
}

async function getAdminToken() {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });

  if (response.status !== 200) {
    throw new Error('Не удалось войти под тестовым администратором');
  }

  return response.body.token;
}

describe('Проверка доступа к товарам', () => {
  it('возвращает 401 без токена при создании товара', async () => {
    const response = await request(app)
      .post('/api/products')
      .send({ name: 'Тестовый товар', price: 100 });

    expect(response.status).toBe(401);
  });

  it('возвращает 401 при недействительном токене', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer invalid.token.value')
      .send({ name: 'Тестовый товар', price: 100 });

    expect(response.status).toBe(401);
  });

  it('возвращает 403 обычному пользователю при создании товара', async () => {
    const token = await getUserToken();

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Тестовый товар', price: 100 });

    expect(response.status).toBe(403);
  });

  it('позволяет администратору создать, изменить и удалить товар', async () => {
    const token = await getAdminToken();

    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Товар для тестирования',
        price: 150,
        category: 'Тесты',
        unit: 'кг'
      });

    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Товар для тестирования');

    const productId = created.body.id;

    const updated = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Изменённый тестовый товар',
        price: 200
      });

    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Изменённый тестовый товар');
    expect(updated.body.price).toBe(200);

    const deleted = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.status).toBe(204);
  });

  it('возвращает 404 для несуществующего товара', async () => {
    const response = await request(app).get('/api/products/999999');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Товар не найден');
  });

  it('запрещает обычному пользователю удалять товар', async () => {
    const token = await getUserToken();

    const response = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});

describe('Проверка доступа к заказам', () => {
  it('возвращает 401 при запросе заказов без токена', async () => {
    const response = await request(app).get('/api/orders');

    expect(response.status).toBe(401);
  });

  it('возвращает 403 обычному пользователю при запросе заказов', async () => {
    const token = await getUserToken();

    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('позволяет администратору получить список заказов', async () => {
    const token = await getAdminToken();

    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
