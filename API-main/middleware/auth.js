import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  // Заголовок выглядит так:  Authorization: Bearer eyJhbGciOi...
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Требуется вход в систему" });
  }

  try {
    // verify проверяет подпись и срок действия; при ошибке — исключение
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch (err) {
    const error =
      err.name === "TokenExpiredError"
        ? "Срок действия токена истёк, войдите снова"
        : "Недействительный токен";
    return res.status(401).json({ error });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Недостаточно прав" });
    } else {
      next();
    }

    // ЗАДАНИЕ: если req.user.role !== role —
    // ЗАДАНИЕ: статус 403 и { error: 'Недостаточно прав' }
    // ЗАДАНИЕ: иначе — передать запрос дальше
  };
}