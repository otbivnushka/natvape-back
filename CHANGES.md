# Changes

## 2026-06-10 — variantName в cart_items

### Добавлено
- **`src/cart/entities/cart-item.entity.ts`** — колонка `variantName` (varchar, nullable)
- **`src/cart/dto/add-to-cart.dto.ts`** — опциональное поле `variantName`

### Изменено
- **`src/cart/cart.service.ts`**:
  - `addItem` — загружает product с variants/colors, резолвит `variantName` (из DTO или из product)
  - `getFullCart` — возвращает `variantName` в ответе
- **`src/orders/orders.service.ts`**:
  - `create` — использует `item.variantName` напрямую вместо ручного резолва

### Миграции
- `src/database/migrations/...-AddVariantNameToCartItems.ts`

## 2026-06-10 — Фикс списания стока для variantKey

### Изменено
- **`src/orders/orders.service.ts`** — списание стока: сначала ищет variant, если не найден — color (if-else вместо двух независимых if)
- **`src/admin/admin.service.ts`** — восстановление стока при удалении заказа: то же if-else через `affected`
