
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

const uniqueEmail = () =>
  `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;

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

async function createOrder() {
  return request(app)
    .post('/api/orders')
    .send({
      name: 'Тестовый покупатель',
      email: uniqueEmail(),
      phone: '+77001234567',
      quantity: 10,
      comment: 'Тестовый заказ'
    });
}

describe('POST /api/orders', () => {
  it('создаёт новый заказ', async () => {
    const response = await createOrder();

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Тестовый покупатель');
    expect(response.body.quantity).toBe(10);
    expect(response.body.status).toBe('new');
  });

  it('возвращает 400 при отсутствии обязательных полей', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ name: 'Покупатель' });

    expect(response.status).toBe(400);
  });

  it('запрещает заказ менее 10 кг', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        name: 'Покупатель',
        email: uniqueEmail(),
        quantity: 5
      });

    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/orders/:id', () => {
  it('позволяет администратору изменить статус заказа', async () => {
    const token = await getAdminToken();
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/orders/${order.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('processing');
  });

  it('возвращает 400 без статуса', async () => {
    const token = await getAdminToken();
    const order = await createOrder();

    const response = await request(app)
      .patch(`/api/orders/${order.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('возвращает 404 для несуществующего заказа', async () => {
    const token = await getAdminToken();

    const response = await request(app)
      .patch('/api/orders/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });

    expect(response.status).toBe(404);
  });
});
