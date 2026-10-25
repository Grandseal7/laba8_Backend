
import { execSync } from 'node:child_process';

export default function setup() {
  const databaseUrl = process.env.DATABASE_URL || '';
  let databaseName = '';

  try {
    databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');
  } catch {
    throw new Error('Не удалось прочитать DATABASE_URL из .env.test');
  }

  if (databaseName !== 'agromarket_test') {
    throw new Error(
      'Тесты остановлены: разрешена только база agromarket_test'
    );
  }

  // Инициализация выполняется отдельной командой с явным .env.test.
  execSync('npm run db:init:test', { stdio: 'inherit' });
}
