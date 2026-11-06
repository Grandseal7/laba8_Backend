
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { pool } from './pool.js';

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL не задан.');
  }

  const migration = readFileSync(
    new URL('./init-production.sql', import.meta.url),
    'utf8'
  );

  await pool.query(migration);

  // Создаём администратора, если он задан и ещё не существует.
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const email = ADMIN_EMAIL.toLowerCase().trim();
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ['Администратор', email, hash]
    );

    console.log(`Администратор проверен: ${email}`);
  }

  console.log('Миграция успешно выполнена.');
}

try {
  await migrate();
} catch (error) {
  console.error('Ошибка миграции:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
