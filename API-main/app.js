
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';

import { logger } from './middleware/loger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { pool } from './db/pool.js';

const app = express();

// Render работает через прокси-балансировщик.
app.set('trust proxy', 1);

// Разрешённые адреса фронтенда.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Защитные HTTP-заголовки.
app.use(helmet());

// CORS для нескольких адресов.
app.use(cors({
  origin(origin, callback) {
    // Разрешаем запросы без Origin (curl и серверные проверки).
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin не разрешён политикой CORS'));
  },
}));

app.use(express.json({ limit: '10kb' }));

// Логирование запросов.
if (process.env.NODE_ENV !== 'test') {
  app.use(logger);
}

// Проверка API и подключения к базе данных.
const VERSION = (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      db: 'ok',
      version: VERSION,
    });
  } catch (error) {
    console.error('Health check failed:', error.message);

    res.status(503).json({
      status: 'error',
      db: 'unavailable',
      version: VERSION,
    });
  }
});
// Информация о приложении.
app.get('/api/about', (req, res) => {
  res.json({
    name: 'АгроМаркет',
    version: process.env.npm_package_version || '1.0.0',
    author: 'Сәлімжан Ғалымбек Темірбекұлы',
  });
});

// Маршруты API.
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Обработка несуществующих маршрутов.
app.use((req, res) => {
  res.status(404).json({
    error: `Маршрут ${req.method} ${req.originalUrl} не найден`,
  });
});

// Обработчик ошибок (всегда после маршрутов).
app.use(errorHandler);

export default app;
