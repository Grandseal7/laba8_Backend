
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  // Получаем заголовок Authorization
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  // Проверяем наличие Bearer-токена
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Требуется вход в систему',
    });
  }

  try {
    // Проверяем подпись и срок действия токена
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Получаем пользователя из данных токена
    req.user = {
      id: Number(payload.sub),
      role: payload.role,
    };

    return next();
  } catch (err) {
    // Обрабатываем истёкший или недействительный токен
    const error =
      err.name === 'TokenExpiredError'
        ? 'Срок действия токена истёк, войдите снова'
        : 'Недействительный токен';

    return res.status(401).json({ error });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    // Проверяем роль пользователя
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        error: 'Недостаточно прав',
      });
    }

    // Если роль подходит, передаём запрос дальше
    return next();
  };
}
