import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { pool } from './pool.js';

const force = process.argv.includes('--force');

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL не задан.');
  }

  let databaseUrl;

  try {
    databaseUrl = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error('DATABASE_URL имеет неверный формат.');
  }

  const localHosts = ['localhost', '127.0.0.1', '::1'];
  const isLocal = localHosts.includes(databaseUrl.hostname);

  // Удалённую базу разрешаем инициализировать только с --force.
  if (!isLocal && !force) {
    throw new Error(
      'Удалённая БД. Для подтверждения первоначальной инициализации добавьте --force.'
    );
  }

  // В production всегда требуется явное подтверждение.
  if (process.env.NODE_ENV === 'production' && !force) {
    throw new Error(
      'В production запуск seed запрещён без флага --force.'
    );
  }

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) {
    throw new Error('Не заданы ADMIN_PASSWORD или ADMIN_EMAIL.');
  }

  const schema = readFileSync(
    new URL('./schema.sql', import.meta.url),
    'utf8'
  );

  const { products } = JSON.parse(
    readFileSync(new URL('../data/db.json', import.meta.url), 'utf8')
  );

  await pool.query(schema);

  for (const product of products) {
    await pool.query(
      `INSERT INTO products (name, category, price, unit, image)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        product.name,
        product.category ?? null,
        Math.round(Number(product.price)),
        product.unit ?? 'кг',
        product.image ?? null,
      ]
    );
  }

  const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')`,
    ['Администратор', email, hash]
  );

  console.log(
    `База инициализирована: товаров — ${products.length}, администратор — ${email}`
  );
}

try {
  await seed();
} catch (error) {
  console.error('Ошибка инициализации:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
