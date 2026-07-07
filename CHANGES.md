# Changes

## 2026-06-10 — Атрибуты товаров

### Добавлено
- **`src/categories/entities/category-attribute.entity.ts`** — сущность `CategoryAttribute` (id, categoryId, name, key, type, required)
- **`src/products/entities/product-attribute.entity.ts`** — сущность `ProductAttribute` (id, productId, attributeId, value)
- **`src/admin/dto/create-category-attribute.dto.ts`** — DTO для создания атрибута категории
- **`src/admin/dto/create-product-attribute.dto.ts`** — DTO для добавления атрибута товару
- **`src/admin/dto/update-product-attribute.dto.ts`** — DTO для обновления значения атрибута

### Изменено
- **`src/products/entities/product.entity.ts`** — добавлена связь `OneToMany` → `ProductAttribute`
- **`src/products/products.module.ts`** — добавлены `ProductAttribute` и `CategoryAttribute` в `TypeOrmModule.forFeature`
- **`src/products/products.service.ts`**:
  - `findAll` — добавлен `leftJoinAndSelect` для attributes + attrDef
  - `findById` — добавлена загрузка attributes, включены в ответ
- **`src/admin/admin.module.ts`** — добавлены `ProductAttribute` и `CategoryAttribute` в `TypeOrmModule.forFeature`
- **`src/admin/admin.service.ts`** — добавлены репозитории и методы CRUD для атрибутов
- **`src/admin/admin.controller.ts`** — добавлены 5 новых роутов для атрибутов

### API.md
- Создан файл с полным описанием всех эндпоинтов

### Миграции
- `src/database/migrations/...-AddCategoryAndProductAttributes.ts` — создание таблиц `category_attributes` и `product_attributes`
