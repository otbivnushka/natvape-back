# NestJS Backend — API Plan

## 1. Database Structure (PostgreSQL via TypeORM)

### Entity: `User`

| Column     | Type          | Notes                  |
|------------|---------------|------------------------|
| id         | int (PK)      | auto-increment         |
| name       | varchar(100)  |                        |
| email      | varchar(255)  | unique                 |
| password   | varchar(255)  | bcrypt hash            |
| phone      | varchar(20)   | nullable               |
| avatar     | varchar(500)  | nullable, URL          |
| createdAt  | timestamp     | default now            |
| updatedAt  | timestamp     | on update              |

### Entity: `Category`

| Column | Type          | Notes          |
|--------|---------------|----------------|
| id     | int (PK)      | auto-increment |
| key    | varchar(50)   | unique, slug   |
| label  | varchar(100)  | display name   |

**Seed data** (replace legacy `smartphones`/`laptops` etc.):

| key           | label          |
|---------------|----------------|
| liquids       | Жидкости       |
| coils         | Испарители     |
| cartridges    | Картриджи      |
| snus          | Снюс           |
| pods          | Поды           |
| disposables   | Одноразки      |

> The frontend `Category` type will need updating from `'smartphones'` / `'laptops'` / … to these new keys.

### Entity: `Product`

| Column        | Type            | Notes                   |
|---------------|-----------------|-------------------------|
| id            | int (PK)        | auto-increment          |
| name          | varchar(200)    |                         |
| categoryId    | int (FK→Category)|                        |
| price         | decimal(10,2)   |                         |
| oldPrice      | decimal(10,2)   | nullable                |
| rating        | decimal(2,1)    | 0.0–5.0                 |
| image         | varchar(500)    | URL                     |
| description   | text            |                         |
| badge         | varchar(10)     | nullable, `'NEW'` or `'SALE'` |
| brand         | varchar(100)    |                         |
| variantLabel  | varchar(50)     | nullable, e.g. `'Вкус'` |
| createdAt     | timestamp       | default now             |
| updatedAt     | timestamp       | on update               |

### Entity: `ProductVariant`

| Column    | Type          | Notes                  |
|-----------|---------------|------------------------|
| id        | int (PK)      | auto-increment         |
| productId | int (FK→Product, CASCADE) |           |
| name      | varchar(100)  | display, e.g. "Вишня"  |
| value     | varchar(100)  | machine, e.g. "cherry" |
| stock     | int           | available inventory    |

### Entity: `ProductColor`

| Column    | Type          | Notes                  |
|-----------|---------------|------------------------|
| id        | int (PK)      | auto-increment         |
| productId | int (FK→Product, CASCADE) |           |
| name      | varchar(100)  | e.g. "Чёрный"          |
| hex       | varchar(7)    | e.g. "#0d1b2a"         |
| stock     | int           | available inventory    |

### Entity: `CartItem`

| Column     | Type             | Notes                           |
|------------|------------------|---------------------------------|
| id         | int (PK)         | auto-increment                  |
| userId     | int (FK→User, CASCADE) |                        |
| productId  | int (FK→Product) |                                  |
| quantity   | int              | >= 1                            |
| variantKey | varchar(100)     | nullable — matches `variant.value` or `color.name` |

**Unique constraint**: `(userId, productId, variantKey)` — prevents duplicate rows.

### Entity: `WishlistItem`

| Column    | Type                   | Notes        |
|-----------|------------------------|--------------|
| id        | int (PK)               | auto-increment |
| userId    | int (FK→User, CASCADE) |               |
| productId | int (FK→Product)       |               |

**Unique constraint**: `(userId, productId)`.

### Entity: `Order`

| Column         | Type                   | Notes                             |
|----------------|------------------------|-----------------------------------|
| id             | int (PK)               | auto-increment                    |
| userId         | int (FK→User)          | nullable if guest checkout later  |
| total          | decimal(10,2)          | sum of order items                |
| status         | enum (string)          | `'processing'` / `'shipping'` / `'delivered'` |
| deliveryMethod | varchar(20)            | `'pickup'` or `'delivery'`        |
| comment        | text                   | nullable                          |
| createdAt      | timestamp              | default now                       |
| updatedAt      | timestamp              | on update                         |

### Entity: `OrderItem`

| Column       | Type             | Notes                  |
|--------------|------------------|------------------------|
| id           | int (PK)         | auto-increment         |
| orderId      | int (FK→Order, CASCADE) |               |
| productId    | int (FK→Product) | snapshot, not updated  |
| productName  | varchar(200)     | snapshot at order time |
| productImage | varchar(500)     | snapshot               |
| variantKey   | varchar(100)     | nullable               |
| variantName  | varchar(100)     | nullable, snapshot     |
| quantity     | int              |                        |
| price        | decimal(10,2)    | unit price at purchase |

---

## 2. ER Diagram

```
User (1) ──< CartItem (0..*) >── (1) Product
User (1) ──< WishlistItem (0..*) >── (1) Product
User (1) ──< Order (0..*) ──< OrderItem (1..*) >── (1) Product (read-only)
Category (1) ──< Product (0..*)
Product (1) ──< ProductVariant (0..*)
Product (1) ──< ProductColor (0..*)
```

---

## 3. Endpoints

### 3.1 Authentication

#### `POST /api/auth/register`

```
Request:
{
  "name": "Максим Волков",
  "email": "max@natvape.ru",
  "password": "securePass123",
  "phone": "+375291234567"
}

Response 201:
{
  "id": 1,
  "name": "Максим Волков",
  "email": "max@natvape.ru",
  "phone": "+375291234567",
  "avatar": null,
  "createdAt": "2026-05-24T10:00:00.000Z"
}

Error 409: { "message": "Email already exists", "statusCode": 409 }
```

#### `POST /api/auth/login`

```
Request:
{
  "email": "max@natvape.ru",
  "password": "securePass123"
}

Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Максим Волков",
    "email": "max@natvape.ru",
    "avatar": "https://...",
    "phone": "+375291234567"
  }
}

Error 401: { "message": "Invalid credentials", "statusCode": 401 }
```

> Use JWT + Passport. `AuthGuard` extracts user from token.

#### `POST /api/auth/logout`

No body. Client discards token.

### 3.2 Categories

#### `GET /api/categories`

```
Response 200:
[
  { "id": 1, "key": "liquids",     "label": "Жидкости",    "productCount": 5 },
  { "id": 2, "key": "coils",       "label": "Испарители",  "productCount": 4 },
  { "id": 3, "key": "cartridges",  "label": "Картриджи",   "productCount": 4 },
  { "id": 4, "key": "snus",        "label": "Снюс",         "productCount": 4 },
  { "id": 5, "key": "pods",        "label": "Поды",         "productCount": 4 },
  { "id": 6, "key": "disposables", "label": "Одноразки",    "productCount": 4 }
]
```

### 3.3 Products

#### `GET /api/products`

| Query Param | Type   | Example       | Description              |
|-------------|--------|---------------|--------------------------|
| category    | string | `liquids`     | filter by category key   |
| search      | string | `яблоко`      | name ILIKE               |
| brand       | string | `Vaporesso`   | exact brand              |
| priceMin    | number | `10`          | price >=                 |
| priceMax    | number | `100`         | price <=                 |
| sort        | string | `price-asc`   | see below                |
| page        | number | `1`           | default: 1               |
| limit       | number | `20`          | default: 20, max: 100    |

**Sort values**: `price-asc`, `price-desc`, `rating`, `name`.

```
Response 200:
{
  "items": [
    {
      "id": 1,
      "name": "Жидкость Bubble Gum 50ml",
      "category": { "id": 1, "key": "liquids", "label": "Жидкости" },
      "price": 25,
      "oldPrice": 30,
      "rating": 4.5,
      "image": "https://placehold.co/400x400/1a1a2e/e94560?text=Bubble+Gum",
      "badge": "SALE",
      "brand": "HQD",
      "variantLabel": "Вкус",
      "variants": [
        { "name": "Вишня", "value": "cherry", "stock": 10 },
        { "name": "Яблоко", "value": "apple", "stock": 5 }
      ],
      "colors": null
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

#### `GET /api/products/:id`

Same item shape as above (full product, no `meta`).

```
Error 404: { "message": "Product not found", "statusCode": 404 }
```

#### `GET /api/products/brands?category=liquids`

```
Response 200: ["HQD", "Vaporesso", "GeekVape"]
```

### 3.4 Cart (all routes require JWT auth)

#### `GET /api/cart`

```
Response 200:
{
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "Жидкость Bubble Gum 50ml",
        "price": 25,
        "image": "https://...",
        "category": { "id": 1, "key": "liquids", "label": "Жидкости" },
        "brand": "HQD",
        "badge": "SALE"
      },
      "quantity": 2,
      "variantKey": "cherry"
    }
  ],
  "totalItems": 2,
  "subtotal": 50
}
```

> Product in cart is **lightweight** (no variants/colors/description).

#### `POST /api/cart`

```
Request:
{
  "productId": 1,
  "quantity": 1,
  "variantKey": "cherry"
}

Response 201: (full cart, same as GET)
Error 404: { "message": "Product not found" }
Error 409: { "message": "Insufficient stock" }
```

#### `PATCH /api/cart/:itemId`

```
Request:  { "quantity": 3 }
Response 200: (full cart)
Error 404: { "message": "Cart item not found" }
Error 409: { "message": "Insufficient stock" }
```

#### `DELETE /api/cart/:itemId`

```
Response 200: (full cart)
Error 404: { "message": "Cart item not found" }
```

#### `DELETE /api/cart`

```
Response 200: { "items": [], "totalItems": 0, "subtotal": 0 }
```

### 3.5 Wishlist (all routes require JWT auth)

#### `GET /api/wishlist`

```
Response 200: { "productIds": [1, 5, 12] }
```

#### `POST /api/wishlist`

```
Request:   { "productId": 1 }
Response 201: { "productIds": [1, 5, 12] }
Error 409: { "message": "Already in wishlist" }
```

#### `DELETE /api/wishlist/:productId`

```
Response 200: { "productIds": [5, 12] }
Error 404: { "message": "Product not in wishlist" }
```

### 3.6 Orders (all routes require JWT auth)

#### `POST /api/orders`

Creates order from current cart.

```
Request:
{
  "deliveryMethod": "pickup",
  "comment": "Позвонить перед выходом"
}

Response 201:
{
  "id": 1004,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Жидкость Bubble Gum 50ml",
      "productImage": "https://...",
      "variantKey": "cherry",
      "variantName": "Вишня",
      "quantity": 2,
      "price": 25
    }
  ],
  "total": 50,
  "status": "processing",
  "deliveryMethod": "pickup",
  "comment": "Позвонить перед выходом",
  "createdAt": "2026-05-24T12:00:00.000Z"
}

Error 400: { "message": "Cart is empty" }
```

Side effects: decrement stock for each variant/color, clear user cart.

#### `GET /api/orders`

```
Response 200:
[
  {
    "id": 1001,
    "total": 49,
    "status": "delivered",
    "itemsCount": 3,
    "createdAt": "2026-04-15T10:00:00.000Z"
  }
]
```

#### `GET /api/orders/:id`

```
Response 200: (full order with items, same shape as POST 201)
Error 404: { "message": "Order not found" }
```

### 3.7 Profile (requires JWT auth)

#### `GET /api/profile`

```
Response 200:
{
  "id": 1,
  "name": "Максим Волков",
  "email": "max@natvape.ru",
  "avatar": "https://...",
  "phone": "+375291234567",
  "totalSpent": 283,
  "ordersCount": 3
}
```

#### `PATCH /api/profile`

```
Request (all optional):
{
  "name": "Максим В.",
  "phone": "+375291111111",
  "avatar": "https://..."
}

Response 200:
{
  "id": 1,
  "name": "Максим В.",
  "email": "max@natvape.ru",
  "avatar": "https://...",
  "phone": "+375291111111"
}
```

> Email/password changes: separate endpoints, not in MVP scope.

---

## 4. NestJS Module Structure

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/jwt-auth.guard.ts
│   ├── decorators/current-user.decorator.ts
│   └── filters/http-exception.filter.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── dto/
│       ├── register.dto.ts
│       └── login.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   └── entities/user.entity.ts
├── categories/
│   ├── categories.module.ts
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   └── entities/category.entity.ts
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── dto/query-products.dto.ts
│   └── entities/
│       ├── product.entity.ts
│       ├── product-variant.entity.ts
│       └── product-color.entity.ts
├── cart/
│   ├── cart.module.ts
│   ├── cart.controller.ts
│   ├── cart.service.ts
│   ├── dto/
│   │   ├── add-to-cart.dto.ts
│   │   └── update-cart-item.dto.ts
│   └── entities/cart-item.entity.ts
├── wishlist/
│   ├── wishlist.module.ts
│   ├── wishlist.controller.ts
│   ├── wishlist.service.ts
│   ├── dto/add-to-wishlist.dto.ts
│   └── entities/wishlist-item.entity.ts
└── orders/
    ├── orders.module.ts
    ├── orders.controller.ts
    ├── orders.service.ts
    ├── dto/create-order.dto.ts
    └── entities/
        ├── order.entity.ts
        └── order-item.entity.ts
```

---

## 5. Key Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^11.x",
    "@nestjs/core": "^11.x",
    "@nestjs/jwt": "^11.x",
    "@nestjs/passport": "^11.x",
    "@nestjs/platform-express": "^11.x",
    "@nestjs/typeorm": "^11.x",
    "bcrypt": "^5.x",
    "class-transformer": "^0.5.x",
    "class-validator": "^0.14.x",
    "passport": "^0.7.x",
    "passport-jwt": "^5.x",
    "pg": "^8.x",
    "reflect-metadata": "^0.2.x",
    "rxjs": "^7.x",
    "typeorm": "^0.3.x"
  }
}
```

---

## 6. Seed Data

Create `src/seed.ts` that populates:

- 6 categories (liquids, coils, cartridges, snus, pods, disposables)
- 25 products (mapped from `src/data/products.ts` with updated category keys)
- All product variants and colors (exact same data as frontend mocks)
- 1 test user (`max@natvape.ru` / `password123`) with 3 mock orders

---

## 7. Frontend Compatibility Notes

1. **Category key rename**: Frontend `Category` type currently uses `'smartphones' | 'laptops' | 'headphones' | 'monitors' | 'accessories' | 'disposables'`. Backend returns `'liquids' | 'coils' | 'cartridges' | 'snus' | 'pods' | 'disposables'`. The frontend must update its `Category` union type to match.

2. **Cart composite key**: Frontend uses `${productId}:${variantKey}`. Backend uses `(userId, productId, variantKey)` unique constraint. Cart store must be updated to fetch/sync with API.

3. **Wishlist**: Backend returns `{ productIds: number[] }` — compatible with existing store shape.

4. **Order items**: Frontend profile expects `CartItem[]` with embedded `Product`. Backend returns `OrderItem[]` with flat snapshot fields. Profile page must handle the new shape.

5. **CORS**: Backend must enable CORS for the frontend dev server origin (`http://localhost:5173`).
