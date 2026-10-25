
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { pool } from './pool.js';

const databaseUrl = process.env.DATABASE_URL || '';

let databaseName = '';

try {
  databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');
} catch {
  console.error('ОШИБКА: DATABASE_URL не задан или имеет неверный формат.');
  process.exit(1);
}

if (databaseName !== 'agromarket_test') {
  console.error(
    'ОШИБКА: db:init разрешён только для базы agromarket_test!'
  );
  process.exit(1);
}

if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) {
  console.error('ОШИБКА: не заданы ADMIN_PASSWORD или ADMIN_EMAIL.');
  process.exit(1);
}

const schema = readFileSync('./db/schema.sql', 'utf-8');
const { products } = JSON.parse(
  readFileSync('./data/db.json', 'utf-8')
);

try {
  await pool.query(schema);

  for (const p of products) {
    await pool.query(
      `INSERT INTO products (name, category, price, unit, image)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        p.name,
        p.category ?? null,
        Math.round(Number(p.price)),
        p.unit ?? 'кг',
        p.image ?? null
      ]
    );
  }

  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')`,
    ['Администратор', process.env.ADMIN_EMAIL, hash]
  );

  console.log(
    `Готово: товаров — ${products.length}, админ — ${process.env.ADMIN_EMAIL}`
  );
} finally {
  await pool.end();
}
