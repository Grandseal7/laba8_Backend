
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

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

// Во время тестов не выводим обычные логи запросов.
if (process.env.NODE_ENV !== 'test') {
  app.use(logger);
}

// Проверка доступности API и подключения к БД.
app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      db: 'connected',
      time: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/about', (req, res) => {
  res.json({
    name: 'АгроМаркет',
    version: '1.0',
    author: 'Сәлімжан Ғалымбек Темірбекұлы'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Обработка несуществующих маршрутов.
app.use((req, res) => {
  res.status(404).json({
    error: `Маршрут ${req.method} ${req.originalUrl} не найден`
  });
});

// Обработчик ошибок подключается после маршрутов.
app.use(errorHandler);

export default app;
