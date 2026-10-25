
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/products', () => {
  it('возвращает список товаров', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const product = response.body[0];

    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
  });
});
