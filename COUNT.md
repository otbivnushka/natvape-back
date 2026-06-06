## Stories

### Таблицы

**`story_sets`**
| Колонка | Тип | Примечание |
|---------|-----|-----------|
| id | int PK | auto-increment |
| title | varchar(255) | |
| image_id | int FK | → images, SET NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

**`stories`**
| Колонка | Тип | Примечание |
|---------|-----|-----------|
| id | int PK | auto-increment |
| image_id | int FK | → images, SET NULL |
| duration | int | default 3000 (ms) |
| title | varchar(255) | nullable → header.heading |
| subtitle | varchar(255) | nullable → header.subheading |
| story_set_id | int FK | → story_sets CASCADE |
| created_at | timestamp | |

### Публичный эндпоинт

```
GET /api/stories
```

Ответ:
```json
[
  {
    "title": "Новинки",
    "image": "https://...",
    "stories": [
      {
        "url": "https://...",
        "duration": 3000,
        "header": {
          "heading": "Новая коллекция",
          "subheading": "VapeMaster X Pro"
        }
      },
      {
        "url": "https://...",
        "duration": 2500
      }
    ]
  }
]
```

### Админские эндпоинты (JWT + AdminGuard)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/admin/story-sets | Создать сторисет + вложенные stories |
| PUT | /api/admin/story-sets/:id | Обновить сторисет |
| DELETE | /api/admin/story-sets/:id | Удалить сторисет (CASCADE stories) |
| POST | /api/admin/story-sets/:id/stories | Добавить историю в сет |
| PATCH | /api/admin/stories/:id | Обновить историю |
| DELETE | /api/admin/stories/:id | Удалить историю |

#### Пример: Создать сторисет с историями

```
POST /api/admin/story-sets
```

```json
{
  "title": "Новинки",
  "imageId": 1,
  "stories": [
    {
      "imageId": 2,
      "duration": 3000,
      "title": "Новая коллекция",
      "subtitle": "VapeMaster X Pro"
    },
    {
      "imageId": 3,
      "duration": 2500
    }
  ]
}
```

#### Пример: Обновить сторисет (только одно поле)

```
PUT /api/admin/story-sets/1
```

```json
{
  "title": "Акции и скидки"
}
```

#### Пример: Создать историю в существующем сете

```
POST /api/admin/story-sets/1/stories
```

```json
{
  "imageId": 4,
  "duration": 4000,
  "title": "Обзор",
  "subtitle": "Lost Vape Orion Bar 10000"
}
```

#### Пример: Обновить историю

```
PATCH /api/admin/stories/1
```

```json
{
  "duration": 3500,
  "title": "Новый заголовок"
}
```

### Seed

5 сторисетов (Новинки, Акции, Обзоры, Советы, Магазин) с историями и Image-заглушками. Данные в `src/data/stories.ts`.

### Новые файлы

| Файл | Описание |
|------|----------|
| src/stories/entities/story-set.entity.ts | Entity StorySet |
| src/stories/entities/story.entity.ts | Entity Story |
| src/stories/stories.controller.ts | GET /api/stories |
| src/stories/stories.service.ts | Бизнес-логика stories |
| src/stories/stories.module.ts | Модуль |
| src/stories/dto/create-story-set.dto.ts | DTO создания сторисета |
| src/stories/dto/update-story-set.dto.ts | DTO обновления сторисета |
| src/stories/dto/create-story.dto.ts | DTO создания истории |
| src/stories/dto/update-story.dto.ts | DTO обновления истории |

### Изменённые файлы

| Файл | Изменение |
|------|-----------|
| src/app.module.ts | Добавлен StoriesModule |
| src/admin/admin.module.ts | Добавлены StorySet, Story в TypeOrmModule.forFeature |
| src/admin/admin.controller.ts | Добавлены 6 admin эндпоинтов |
| src/admin/admin.service.ts | Добавлены 6 методов CRUD |
| src/seed.ts | Дроп stories/story_sets, создание Image + StorySet + Story |
| src/data/stories.ts | Seed данные (новый файл) |
