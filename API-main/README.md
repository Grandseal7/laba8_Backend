## Переменные окружения (.env)
JWT_SECRET      — случайная строка 64 символа (node -e "...randomBytes(32)...")
JWT_EXPIRES_IN  — срок жизни токена, например 2h
ADMIN_EMAIL / ADMIN_PASSWORD — администратор, создаётся командой npm run db:init
 
## Эндпоинты (новые и изменённые)
| Метод  | Путь                 | Доступ  | Ответы             |
|--------|----------------------|---------|--------------------|
| POST   | /api/auth/register   | все     | 201, 400, 409      |
| POST   | /api/auth/login      | все     | 200, 400, 401, 429 |
| GET    | /api/auth/me         | токен   | 200, 401           |
| POST   | /api/products        | admin   | 201, 400, 401, 403 |
| PUT    | /api/products/:id    | admin   | 200, 400, 401, 403, 404 |
| DELETE | /api/products/:id    | admin   | 204, 401, 403, 404 |
| GET    | /api/orders          | admin   | 200, 401, 403      |
| PATCH  | /api/orders/:id      | admin   | 200, 400, 401, 403, 404 |
