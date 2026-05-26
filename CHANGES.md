# Changes & Admin API Documentation

## 1. Новое поле `isAdmin` у пользователя

В таблицу `users` добавлено поле `is_admin` (boolean, default `false`).

**Как фронту понять, что пользователь — админ:**

`GET /api/profile` (JWT) теперь возвращает:
```json
{
  "id": 1,
  "name": "Максим Волков",
  "email": "max@natvape.ru",
  "phone": "+375291234567",
  "avatar": null,
  "isAdmin": true,
  "addresses": [...],
  "totalSpent": 283,
  "ordersCount": 3
}
```

Если `isAdmin: true` — показывать админ-панель.

---

## 2. Акции: `oldPrice` → `doublePrice`, новый формат `badge`

### В ответе `GET /api/products` и `GET /api/products/:id`:

**Было:**
```json
{
  "oldPrice": 30,
  "badge": "SALE"
}
```

**Стало:**
```json
{
  "doublePrice": 45,
  "badge": "1 + 1 = 45"
}
```

- `doublePrice` — цена по акции **1 + 1 = X** (два товара по цене X, например 2 × 25 = 45 вместо 50)
- Если акции нет — `doublePrice: null`, `badge: null`
- `badge` теперь может содержать ТОЛЬКО строку вида `"1 + 1 = 45"` или `null` (никаких `"SALE"` / `"NEW"`)

---

## 3. Статусы заказов

**Было:** `processing` → `shipping` → `delivered`

**Стало:** `sent` → `end`

| Статус | Значение |
|--------|----------|
| `sent`  | Отправлено админу (новый заказ, ожидает обработки) |
| `end`   | Завершён (доставлен / получен) |

- Новый заказ при создании получает статус `sent`
- Менять статус может **только админ** (через админ-эндпоинт)
- Пользователь видит свои заказы через `GET /api/orders` и `GET /api/orders/:id` (без изменений)

---

## 4. Админ-эндпоинты (`/api/admin`)

**Аутентификация:** все эндпоинты требуют `Authorization: Bearer <token>` и `isAdmin: true`.
При невалидном токене → `401 Unauthorized`. При недостаточных правах → `403 Forbidden`.

---

### 4.1 Управление товарами

#### `POST /api/admin/products`
Создать товар (можно сразу с вариантами/цветами).

```json
// body
{
  "name": "Жидкость Bubble Gum 50ml",
  "categoryId": 1,
  "price": 25,
  "doublePrice": 45,
  "rating": 4.5,
  "image": "https://...",
  "description": "Описание",
  "badge": "1 + 1 = 45",
  "brand": "HQD",
  "variantLabel": "Вкус",
  "variants": [
    { "name": "Вишня", "value": "cherry", "stock": 10 }
  ],
  "colors": [
    { "name": "Чёрный", "hex": "#000000", "stock": 5 }
  ]
}
```

```json
// response — созданный товар с relations
{
  "id": 26,
  "name": "Жидкость Bubble Gum 50ml",
  "categoryId": 1,
  "category": { "id": 1, "key": "liquids", "label": "Жидкости" },
  "price": "25.00",
  "doublePrice": "45.00",
  "rating": "4.5",
  "image": "https://...",
  "description": "Описание",
  "badge": "1 + 1 = 45",
  "brand": "HQD",
  "variantLabel": "Вкус",
  "variants": [{ "id": 26, "name": "Вишня", "value": "cherry", "stock": 10 }],
  "colors": [{ "id": 26, "name": "Чёрный", "hex": "#000000", "stock": 5 }]
}
```

#### `PUT /api/admin/products/:id`
Обновить товар. Все поля опциональны, передавать только то, что нужно изменить.

```json
// body
{
  "price": 30,
  "doublePrice": 55
}
```

#### `DELETE /api/admin/products/:id`
Удалить товар (каскадно удаляет варианты, цвета, корзины/избранное с этим товаром).

```json
// response — статус 200, тело отсутствует
```

---

### 4.2 Управление вариантами

#### `POST /api/admin/products/:id/variants`
Добавить вариант к товару.

```json
// body
{
  "name": "Манго",
  "value": "mango",
  "stock": 15
}
```

#### `PATCH /api/admin/products/variants/:variantId`
Обновить вариант (например, изменить количество).

```json
// body
{
  "stock": 20
}
```

#### `DELETE /api/admin/products/variants/:variantId`
Удалить вариант.

---

### 4.3 Управление цветами

#### `POST /api/admin/products/:id/colors`
Добавить цвет к товару.

```json
// body
{
  "name": "Синий",
  "hex": "#1b4965",
  "stock": 8
}
```

#### `PATCH /api/admin/products/colors/:colorId`
Обновить цвет.

```json
// body
{
  "stock": 10
}
```

#### `DELETE /api/admin/products/colors/:colorId`
Удалить цвет.

---

### 4.4 Управление категориями

#### `POST /api/admin/categories`
```json
// body
{
  "key": "sale",
  "label": "Распродажа"
}
```

#### `PUT /api/admin/categories/:id`
```json
// body
{
  "label": "Акции"
}
```

#### `DELETE /api/admin/categories/:id`
Удалить категорию (если есть товары — ошибка FK).

---

### 4.5 Управление заказами

#### `GET /api/admin/orders`
Все заказы (независимо от пользователя) со статусами и товарами, сортировка по дате (сначала новые).

```json
// response
[
  {
    "id": 3,
    "userId": 1,
    "user": { "id": 1, "name": "Максим Волков", "email": "max@natvape.ru", "phone": "+375291234567" },
    "total": "159.00",
    "status": "sent",
    "deliveryMethod": "pickup",
    "comment": null,
    "address": { "id": 1, "label": "Дом", "lat": 55.194, "lng": 30.112 },
    "deliveryTime": "16:00",
    "createdAt": "2026-05-24T10:00:00.000Z",
    "items": [...]
  },
  ...
]
```

#### `GET /api/admin/orders/sent`
Только заказы со статусом `sent` (ожидающие обработки).

```json
// response — тот же формат, что и GET /api/admin/orders
```

#### `PATCH /api/admin/orders/:id/status`
Изменить статус заказа.

```json
// body
{
  "status": "end"
}
// status может быть только "sent" или "end"
```

#### `DELETE /api/admin/orders/:id`
Удалить заказ.

---

## 5. Запуск

После пула изменений нужно:
```bash
# Пересоздать схему БД (синхронизация через synchronize: true)
# Просто запустить приложение:
npm run start:dev

# Перезаполнить seed-данные (удалит всё и создаст заново):
npm run seed
```

Seed-пользователь `max@natvape.ru / password123` теперь имеет `isAdmin: true` и может пользоваться админ-эндпоинтами.
