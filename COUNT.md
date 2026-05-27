# Авторизация (Auth)

## Таблица `users`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | `INTEGER` (PK, auto increment) | Уникальный ID пользователя |
| `name` | `VARCHAR(100)` | Имя пользователя |
| `email` | `VARCHAR(255)` (UNIQUE) | Email (логин) |
| `password` | `VARCHAR(255)` | Хэш пароля (bcrypt, 10 rounds) |
| `phone` | `VARCHAR(20)` (nullable) | Номер телефона |
| `avatar` | `VARCHAR(500)` (nullable) | URL аватара |
| `isAdmin` | `BOOLEAN` (default `false`) | Флаг администратора |
| `createdAt` | `TIMESTAMP` (auto) | Дата создания |
| `updatedAt` | `TIMESTAMP` (auto) | Дата обновления |

### Связи

- `cartItems` → `CartItem[]` — корзина
- `wishlistItems` → `WishlistItem[]` — избранное
- `orders` → `Order[]` — заказы

## Регистрация

`POST /api/auth/register`

**Body:**
```json
{
  "name": "Иван",
  "email": "ivan@example.com",
  "password": "qwerty123",
  "phone": "+79991234567"  // опционально
}
```

**Проверки:**
- `name` — строка, min 2 символа
- `email` — валидный email
- `password` — строка, min 6 символов
- `phone` — строка, опционально

**Логика:**
1. Проверка, что email уникален (иначе `409 Conflict`)
2. Пароль хэшируется через `bcrypt.hash(password, 10)`
3. Пользователь создаётся в БД
4. Возвращается объект пользователя **без поля `password`**

**Ответ (201):**
```json
{
  "id": 1,
  "name": "Иван",
  "email": "ivan@example.com",
  "phone": "+79991234567",
  "avatar": null,
  "isAdmin": false,
  "createdAt": "2026-05-27T10:00:00.000Z",
  "updatedAt": "2026-05-27T10:00:00.000Z"
}
```

## Вход (логин)

`POST /api/auth/login`

**Body:**
```json
{
  "email": "ivan@example.com",
  "password": "qwerty123"
}
```

**Логика:**
1. Поиск пользователя по email
2. Сравнение пароля через `bcrypt.compare`
3. Если не совпадает — `401 Unauthorized` (текст ошибки всегда `Invalid credentials`, без уточнения поля)
4. Генерация JWT-токена: `{ sub: user.id }`, подпись `JWT_SECRET` из `.env`, срок действия **7 дней**
5. Возвращается токен + объект пользователя без `password`

**Ответ (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Иван",
    "email": "ivan@example.com",
    "phone": "+79991234567",
    "avatar": null,
    "isAdmin": false,
    "createdAt": "2026-05-27T10:00:00.000Z",
    "updatedAt": "2026-05-27T10:00:00.000Z"
  }
}
```

## Выход (logout)

`POST /api/auth/logout`

JWT — stateless, бэкенд ничего не инвалидирует. Просто возвращает `{ message: "Logged out" }`. Фронт удаляет токен из хранилища.

## Проверка токена (JWT Strategy)

**Где:** `src/auth/jwt.strategy.ts`

- Токен извлекается из заголовка `Authorization: Bearer <token>`
- Верифицируется ключом `JWT_SECRET` (из `.env`, fallback `natvape-secret-key`)
- Payload: `{ sub: number }` (ID пользователя)
- В `validate()` по `payload.sub` загружается пользователь из БД
- Если пользователь не найден — `401 Unauthorized`
- Если найден — `request.user` = полный объект `User`

## Guards

### JwtAuthGuard

**Файл:** `src/common/guards/jwt-auth.guard.ts`

Наследует `AuthGuard('jwt')` от `@nestjs/passport`. Если токен отсутствует или невалиден — `401 Unauthorized`.

Используется на всех защищённых маршрутах:
- Корзина: `CartController`
- Избранное: `WishlistController`
- Заказы: `OrdersController`
- Профиль: `ProfileController`
- Адреса: `AddressesController`
- Админка: `AdminController`

### AdminGuard

**Файл:** `src/common/guards/admin.guard.ts`

Проверяет `request.user.isAdmin === true`. Если нет — `403 Forbidden`.

Используется **в паре с JwtAuthGuard** на всех маршрутах `AdminController`.

## Админский пользователь

Создаётся через seed (`npm run seed`):
- Email: `max@natvape.ru`
- Пароль: `password123`
- `isAdmin: true`

## Модуль AuthModule

**Файл:** `src/auth/auth.module.ts`

```typescript
imports: [
  UsersModule,           // для UsersService
  PassportModule,        // паспортная стратегия
  JwtModule.registerAsync({
    secret: JWT_SECRET,  // из ConfigService
    signOptions: { expiresIn: '7d' },
  }),
]
providers: [AuthService, JwtStrategy]
exports: [AuthService]
```

## Публичные маршруты (без авторизации)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/categories` (+ по ID)
- `GET /api/products` (+ по ID)
- `GET /api/images/:filename`
