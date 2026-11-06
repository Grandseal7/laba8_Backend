const PG_CLIENT_ERRORS = {
  '22P02': 'Неверный формат значения',
  '23502': 'Не заполнено обязательное поле',
  '23503': 'Связанная запись не найдена',
  '23514': 'Значение не проходит проверку в БД',
};

export function errorHandler(err, req, res, next) {
  if (PG_CLIENT_ERRORS[err.code]) {
    return res.status(400).json({
      error: PG_CLIENT_ERRORS[err.code],
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Такая запись уже существует',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Слишком большой запрос',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Некорректный JSON в теле запроса',
    });
  }

  if (err.message === 'Origin не разрешён политикой CORS') {
    return res.status(403).json({
      error: 'Запрос с этого адреса запрещён',
    });
  }

  console.error(err);

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(err.status || 500).json({
    error: isProduction && (!err.status || err.status >= 500)
      ? 'Внутренняя ошибка сервера'
      : err.message || 'Ошибка сервера',
  });
}