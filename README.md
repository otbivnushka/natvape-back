# NatVape Backend

**Backend for NatVape vape shop. Telegram Mini App.**

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs)](https://nestjs.com)
[![TypeORM](https://img.shields.io/badge/TypeORM-1.x-FE2C55?logo=typeorm)](https://typeorm.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql)](https://postgresql.org)
[![JWT](https://img.shields.io/badge/JWT-black?logo=jsonwebtoken)](https://jwt.io)

---

## Stack

- **NestJS 11** — framework
- **TypeORM** — ORM with custom `SnakeNamingStrategy`
- **PostgreSQL** — database
- **JWT + Passport** — authentication
- **bcrypt** — password hashing
- **class-validator / class-transformer** — DTO validation
- **Telegraf / nestjs-telegraf** — Telegram Bot

---

## Features

- Registration / login with JWT (access token, 30 days)
- Products: pagination, filters (category, price, brand, search), sorting, brand list
- Categories with product count
- Cart with unique constraint `(user + product + variant)`
- Wishlist
- Orders: create from cart, stock decrement, item snapshots
- Profile with order history and total spent
- Saved delivery addresses
- Snake-case in DB (`user_id`), camelCase in code (`userId`)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env
```

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=natvape
JWT_SECRET=your_secret_key
```

```bash
# 3. Seed the database with test data
npm run seed

# 4. Start dev server
npm run start:dev
```

Server starts at **http://localhost:3000**.
CORS is configured for **http://localhost:5173** (Vite frontend).

---

## API Endpoints

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Public

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns `accessToken` |
| POST | `/api/auth/logout` | Logout (no-op) |
| GET | `/api/categories` | List categories with `productCount` |
| GET | `/api/products` | List products with filters & pagination |
| GET | `/api/products/:id` | Product details |
| GET | `/api/products/brands` | List brands |

### JWT Required

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/cart` | Get user cart |
| POST | `/api/cart` | Add item to cart |
| PATCH | `/api/cart/:itemId` | Update item quantity |
| DELETE | `/api/cart/:itemId` | Remove item from cart |
| DELETE | `/api/cart` | Clear cart |
| GET | `/api/wishlist` | Get wishlist `productIds` |
| POST | `/api/wishlist` | Add to wishlist |
| DELETE | `/api/wishlist/:productId` | Remove from wishlist |
| POST | `/api/orders` | Create order from cart |
| GET | `/api/orders` | List user orders |
| GET | `/api/orders/:id` | Order details |
| GET | `/api/profile` | Profile with `totalSpent` and `ordersCount` |
| PATCH | `/api/profile` | Update `name`, `phone`, `avatar` |
| GET | `/api/addresses` | List saved addresses |
| POST | `/api/addresses` | Add address |
| DELETE | `/api/addresses/:id` | Delete address |

---
