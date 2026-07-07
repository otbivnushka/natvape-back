# API Reference

Base URL: `http://localhost:3000` (или `https://mini-app-server.local`)

---

## Products (public)

### `GET /api/products`

Get all products with filters and pagination.

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category key |
| `search` | string | Search by name (ILIKE) |
| `brand` | string | Filter by brand |
| `priceMin` | number | Min price |
| `priceMax` | number | Max price |
| `sort` | `price-asc` / `price-desc` / `rating` / `name` | |
| `page` | number | Default 1 |
| `limit` | number | Default 999 |
| `userId` | number | Include user's rate |

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Product Name",
      "category": { "id": 1, "key": "pod-system", "label": "Pod system" },
      "price": 1990.00,
      "doublePrice": null,
      "rating": 4.5,
      "image": "http://localhost:3000/api/images/photo.jpg",
      "imageId": 5,
      "badge": "NEW",
      "brand": "BrandName",
      "variantLabel": "Вкус",
      "visible": true,
      "attributes": [
        { "id": 1, "name": "Крепость", "key": "strength", "type": "number", "value": "20" }
      ]
    }
  ],
  "meta": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 }
}
```

### `GET /api/products/:id`

Get product by ID.

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `userId` | number | Include user's rate |

**Response:**
```json
{
  "id": 1,
  "name": "Product Name",
  "category": { "id": 1, "key": "pod-system", "label": "Pod system" },
  "price": 1990.00,
  "doublePrice": null,
  "rating": 4.5,
  "image": "http://localhost:3000/api/images/photo.jpg",
  "imageId": 5,
  "description": "Full description",
  "badge": "NEW",
  "brand": "BrandName",
  "variantLabel": "Вкус",
  "visible": true,
  "userRate": 4,
  "attributes": [
    { "id": 1, "name": "Крепость", "key": "strength", "type": "number", "value": "20" }
  ],
  "variants": [
    { "id": 1, "name": "Ананас манго", "value": "ananas-mango", "stock": 10 }
  ],
  "colors": [
    { "id": 1, "name": "Черный", "hex": "#000000", "stock": 5 }
  ]
}
```

### `GET /api/products/brands`

Get unique brands, optionally filtered by category.

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category key |

**Response:** `["Brand1", "Brand2"]`

---

## Cart (auth required)

### `GET /api/cart`

Get current user's cart.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "Product",
        "price": 100,
        "doublePrice": null,
        "image": "http://.../api/images/photo.jpg",
        "imageId": 5,
        "category": { "id": 1, "key": "liquid", "label": "Жидкости" },
        "brand": "Brand",
        "badge": null
      },
      "quantity": 2,
      "effectivePrice": 200,
      "variantKey": "ananas-mango",
      "variantName": "Ананас манго"
    }
  ],
  "totalItems": 2,
  "subtotal": 200
}
```

### `POST /api/cart`

Add item to cart. If same product+variantKey exists — increments quantity.

**Body:**
```json
{
  "productId": 1,
  "quantity": 1,
  "variantKey": "ananas-mango",
  "variantName": "Ананас манго"
}
```

### `PATCH /api/cart/:itemId`

Update item quantity.

**Body:**
```json
{ "quantity": 3 }
```

**Errors:**
- `400` — если запрошенное quantity превышает доступный stock

### `DELETE /api/cart/:itemId`

Remove item from cart.

### `DELETE /api/cart`

Clear entire cart.

---

## Wishlist (auth required)

### `GET /api/wishlist`

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Product",
      "price": 100,
      "image": "http://...",
      "attributes": [...],
      "variants": [...],
      "colors": [...]
    }
  ]
}
```

### `POST /api/wishlist`

**Body:** `{ "productId": 1 }`

### `DELETE /api/wishlist/:productId`

---

## Orders (auth required)

### `POST /api/orders`

Create order from cart.

**Body:**
```json
{
  "deliveryMethod": "pickup" | "delivery",
  "comment": "string",
  "addressId": 119,
  "deliveryTime": "12:00-14:00"
}
```

### `GET /api/orders`

Get all user orders (summary).

### `GET /api/orders/:id`

Get order by ID with items.

**Response:**
```json
{
  "id": 4175,
  "userId": 2359,
  "total": 117.00,
  "status": "sent",
  "deliveryMethod": "pickup",
  "items": [
    {
      "id": 6352,
      "productName": "CATSWILL ×MALASIAN (50mg)",
      "productImage": "http://.../api/images/file_19.webp",
      "variantKey": "ananas-mango-limon",
      "variantName": "Ананас манго лимон",
      "quantity": 1,
      "price": 17.00
    }
  ]
}
```

---

## Addresses (auth required)

### `GET /api/addresses`

Get all user's addresses.

### `GET /api/addresses/pickup`

Get all pickup addresses (`isPickup: true`). Public.

### `POST /api/addresses`

Create address.
```json
{ "label": "Home", "lat": 53.9, "lng": 27.56 }
```

### `DELETE /api/addresses/:id`

---

## Stories (public)

### `GET /api/stories`

Get all story sets with stories.

**Response:**
```json
[
  {
    "title": "Новинки",
    "image": "http://.../api/images/cover.jpg",
    "stories": [
      {
        "url": "http://.../api/images/story.jpg",
        "duration": 3000,
        "header": { "heading": "Заголовок", "subheading": "Подзаголовок" }
      }
    ]
  }
]
```

---

## Rates (auth required)

### `POST /api/rates`

```json
{ "productId": 1, "value": 4 }
```

### `DELETE /api/rates/:productId`

---

## Images (auth required)

### `POST /api/images/upload`

Upload image (multipart/form-data, field: `file`).

### `GET /api/images/:filename`

Serve image file.

---

## Auth

### `POST /api/auth/login`

```json
{ "initData": "telegram_init_data_string" }
```

**Response:** `{ "accessToken": "jwt_token" }`

---

## Admin (auth required + admin role)

### Products

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/products` | Create product with variants and colors |
| `PUT` | `/api/admin/products/:id` | Update product fields |
| `DELETE` | `/api/admin/products/:id` | Delete product |

### Variants

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/products/:id/variants` | Add variant |
| `PATCH` | `/api/admin/products/variants/:variantId` | Update variant |
| `DELETE` | `/api/admin/products/variants/:variantId` | Delete variant |

### Colors

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/products/:id/colors` | Add color |
| `PATCH` | `/api/admin/products/colors/:colorId` | Update color |
| `DELETE` | `/api/admin/products/colors/:colorId` | Delete color |

### Category Attributes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/category-attributes` | Create attribute definition |
| `DELETE` | `/api/admin/category-attributes/:id` | Delete attribute definition |

**`POST /api/admin/category-attributes` body:**
```json
{
  "categoryId": 1,
  "name": "Крепость",
  "key": "strength",
  "type": "number",
  "required": false
}
```

### Product Attributes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/products/:id/attributes` | Add attribute value to product |
| `PATCH` | `/api/admin/products/attributes/:attrId` | Update attribute value |
| `DELETE` | `/api/admin/products/attributes/:attrId` | Delete attribute value |

**`POST /api/admin/products/:id/attributes` body:**
```json
{
  "attributeId": 1,
  "value": "20"
}
```

### Categories

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/categories` | Create category |
| `PUT` | `/api/admin/categories/:id` | Update category |
| `DELETE` | `/api/admin/categories/:id` | Delete category |

### Orders

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/admin/orders` | All orders |
| `GET` | `/api/admin/orders/user/:userId` | Orders by user |
| `GET` | `/api/admin/orders/sent` | Sent orders |
| `PATCH` | `/api/admin/orders/:id/status` | Update status (`sent` / `end`) |
| `DELETE` | `/api/admin/orders/:id` | Delete order |

### Pickup Addresses

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/addresses` | Create pickup address |
| `DELETE` | `/api/admin/addresses/:id` | Delete pickup address |

### Story Sets

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/story-sets` | Create story set with stories |
| `DELETE` | `/api/admin/story-sets/:id` | Delete story set |
| `POST` | `/api/admin/story-sets/:id/stories` | Add story |
| `DELETE` | `/api/admin/stories/:id` | Delete story |
