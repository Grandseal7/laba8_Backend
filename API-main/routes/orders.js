import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const adminOnly = [requireAuth, requireRole('admin')];

// GET /api/orders — получить список заявок (только администратор)
router.get('/', adminOnly, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      o.*,
      p.name AS product_name
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    ORDER BY o.created_at DESC
  `);

  res.json(rows);
});

// POST /api/orders — создать новую заявку
router.post('/', async (req, res) => {
  const {
    product_id,
    name,
    email,
    phone,
    quantity,
    date,
    comment
  } = req.body || {};

  // Проверка обязательных полей
  if (!name || !email || quantity === undefined || quantity === null || quantity === '') {
    return res.status(400).json({
      error: 'Поля name, email и quantity обязательны'
    });
  }

  // Количество должно быть целым числом не меньше 10
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 10) {
    return res.status(400).json({
      error: 'Количество должно быть целым числом не меньше 10 кг'
    });
  }

  const { rows } = await pool.query(
    `INSERT INTO orders
      (product_id, name, email, phone, quantity, delivery_date, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      product_id || null,
      name,
      email,
      phone || null,
      parsedQuantity,
      date || null,
      comment || null
    ]
  );

  res.status(201).json(rows[0]);
});

// PATCH /api/orders/:id — изменить статус заявки (только администратор)
router.patch('/:id', adminOnly, async (req, res) => {
  const { status } = req.body || {};

  if (!status) {
    return res.status(400).json({
      error: 'Поле status обязательно'
    });
  }

  // Разрешённые статусы из структуры базы данных
  const allowedStatuses = ['new', 'processing', 'done', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Недопустимый статус заявки'
    });
  }

  const { rows } = await pool.query(
    `UPDATE orders
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, req.params.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      error: 'Заявка не найдена'
    });
  }

  res.status(200).json(rows[0]);
});

export default router;