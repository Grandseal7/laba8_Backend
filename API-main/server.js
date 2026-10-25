import 'dotenv/config'
import express from "express";
import cors from 'cors'
import helmet from 'helmet';
import productsRouter from './routes/products.js'
import ordersRouter from './routes/orders.js'
import { logger } from "./middleware/loger.js";
import { errorHandler } from './middleware/errorHandler.js';
import { pool } from './db/pool.js';
import authRouter from './routes/auth.js';   
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('Не задан JWT_SECRET в .env');
  process.exit(1);
}

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({limit:'10kb'}))
app.use(logger)
app.use(errorHandler);
app.use('/api/auth', authRouter);




// Маршрут: метод GET + путь '/'

// «Жив ли сервер?» — такой маршрут есть почти в каждом API
app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
});


app.get("/api/about", (req, res) => {
  res.json({ name: "АгроМаркет", version:"1.0", author: "Повышев Дмитрий Владимирович" });
});

app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)



app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});


app.listen(PORT, () => {
  console.log(`API запущен: http://localhost:${PORT}`);
});

