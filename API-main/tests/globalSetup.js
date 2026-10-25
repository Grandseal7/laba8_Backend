import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

export default function globalSetup() {
  // Локально загружаем .env.test, если файл существует.
  // В GitHub Actions переменные передаются через workflow.
  if (existsSync('.env.test')) {
    dotenv.config({
      path: '.env.test',
      override: true,
    });
  }

  const databaseUrl = process.env.DATABASE_URL || '';
  let databaseName;

  try {
    databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');
  } catch {
    throw new Error(
      'Не удалось определить тестовую БД из DATABASE_URL',
    );
  }

  // Защита от запуска тестовой инициализации на основной БД.
  if (databaseName !== 'agromarket_test') {
    throw new Error(
      'Тесты остановлены: разрешена только база agromarket_test',
    );
  }

  // Инициализируем тестовую БД из текущего окружения.
  execSync('node db/seed.js', {
    stdio: 'inherit',
    env: process.env,
  });
}
