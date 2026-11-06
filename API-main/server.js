import 'dotenv/config';
import app from './app.js';
import { pool } from './db/pool.js';

const requiredVariables = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];

const missingVariables = requiredVariables.filter(
  (name) => !process.env[name]
);

if (missingVariables.length > 0) {
  console.error(`Не заданы переменные окружения: ${missingVariables.join(', ')}`);
  process.exit(1);
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.JWT_SECRET.length < 32
) {
  console.error('JWT_SECRET в production должен содержать минимум 32 символа.');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`АгроМаркет API запущен на порту ${PORT}`);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Получен ${signal}. Завершаем работу...`);

  server.close(async () => {
    try {
      await pool.end();
      console.log('Соединения с БД закрыты.');
      process.exit(0);
    } catch (error) {
      console.error('Ошибка при закрытии БД:', error.message);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));