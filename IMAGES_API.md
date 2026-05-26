# Images API

## Конфигурация (.env)

```
UPLOAD_DIR=D:/uploads/natvape
BASE_URL=http://localhost:3000
```

- `UPLOAD_DIR` — абсолютный путь для сохранения файлов на диске
- `BASE_URL` — используется для построения полного URL в ответе

## Как это работает

1. Фронт отправляет изображение через `POST /api/images/upload` (multipart/form-data)
2. Сервер конвертирует в WebP (quality 80), сохраняет на диск и запись в БД
3. Возвращает `{ id, url }` — полный URL, готовый для использования
4. Для удаления — `DELETE /api/images/:id`
5. GET-эндпоинт отдаёт сам файл (браузер открывает как картинку)

---

## Эндпоинты

### `POST /api/images/upload`

Загрузить одно изображение.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: поле `file` с файлом
- Допустимые форматы: JPEG, PNG, GIF, WebP
- Макс. размер: 5MB

**Response (201):**
```json
{
  "id": 5,
  "url": "http://localhost:3000/api/images/2026-05-26_12-30-45_a1b2c.webp"
}
```

**Response (400):**
```json
{
  "message": "Only images allowed",
  "statusCode": 400
}
```

---

### `GET /api/images/:filename`

Получить файл изображения.

**Request:**
- Method: `GET`

**Response:**
- `200` — тело файла (image/webp)
- `404` — файл не найден

**Пример:** `<img src="http://localhost:3000/api/images/2026-05-26_12-30-45_a1b2c.webp" />`

---

### `DELETE /api/images/:id`

Удалить изображение (запись в БД + файл с диска).

**Request:**
- Method: `DELETE`

**Response (200):**
```json
{
  "message": "Image deleted"
}
```

**Response (404):**
```json
{
  "message": "Image not found",
  "statusCode": 404
}
```

---

## Формат имени файла

`YYYY-MM-DD_HH-mm-ss_XXXX.webp`

- Дата и время загрузки
- 4 случайных символа для уникальности
- Всегда `.webp` (конвертируется на сервере)

## Пример использования на фронте

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const { data } = await axiosInstance.post('/api/images/upload', formData);

// data.url → "http://localhost:3000/api/images/2026-05-26_12-30-45_a1b2c.webp"
// Использовать как src для img:
imageElement.src = data.url;
```

---

## Связь с продуктами

В таблице `products` колонка `image_id` (FK → `images.id`) хранит ссылку на изображение.

### Создание товара с изображением

```typescript
// 1. Загрузить изображение
const formData = new FormData();
formData.append('file', file);
const { data: img } = await axiosInstance.post('/api/images/upload', formData);
// img → { id: 5, url: "http://..." }

// 2. Создать товар, указав imageId
const { data: product } = await axiosInstance.post('/api/admin/products', {
  name: 'Жидкость Bubble Gum 50ml',
  categoryId: 1,
  price: 25,
  description: '...',
  brand: 'HQD',
  imageId: img.id,  // ← id из ответа /api/images/upload
});
```

### GET /api/products — ответ

Поле `image` всегда содержит **полный URL**:

```json
{
  "id": 1,
  "image": "http://localhost:3000/api/images/2026-05-26_12-30-45_a1b2c.webp"
}
```

Если `image_id` равен `NULL` — приходит плейсхолдер:

```json
{
  "id": 2,
  "image": "https://placehold.co/600x600?text=Нет+изображения"
}
```

### Обновление изображения товара

```typescript
// Загрузить новое изображение
const { data: newImg } = await axiosInstance.post('/api/images/upload', formData);

// Обновить товар
await axiosInstance.patch('/api/admin/products/1', {
  imageId: newImg.id,  // id из ответа /api/images/upload
});

// Чтобы убрать изображение — передать imageId: null или 0
await axiosInstance.patch('/api/admin/products/1', {
  imageId: null,
});
```

### Cart & Orders

- В корзине (`GET /api/cart`) поле `product.image` тоже содержит полный URL или placeholder
- В заказе (`POST /api/orders`) поле `productImage` в каждом `OrderItem` содержит полный URL или placeholder
```
