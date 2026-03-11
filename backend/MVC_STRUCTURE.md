# 📋 MVC Архитектура бэкенда

## 📁 Структура проекта

```
backend/src/
├── config/                 # Конфигурация приложения
│   ├── database.ts        # Подключение к БД (Prisma)
│   └── env.ts             # Переменные окружения
├── controllers/           # Контроллеры (обработка запросов)
│   └── productController.ts
├── models/                # Модели (работа с БД через Prisma)
│   └── productModel.ts
├── routes/                # Маршруты
│   └── productRoutes.ts
├── middleware/            # Middleware
│   ├── logger.ts          # Логирование запросов
│   ├── errorHandler.ts    # Обработка ошибок
│   └── auth.ts            # Аутентификация (JWT)
├── services/              # Бизнес-логика (опционально)
├── utils/                 # Утилиты
│   └── helpers.ts
├── types/                 # TypeScript типы
│   └── index.ts
├── app.ts                 # Инициализация Express
└── index.ts               # Точка входа
```

## 🎯 Описание слоёв

### 1. **Controllers** (`controllers/productController.ts`)
Обрабатывают HTTP запросы и отправляют ответы. Содержат логику маршрутизации.

**Методы:**
- `getAllProducts()` - GET /api/products
- `getProductById()` - GET /api/products/:id
- `getProductsByCategory()` - GET /api/products/category/:category
- `searchProducts()` - GET /api/products/search?q=query
- `createProduct()` - POST /api/products (требует аутентификации)
- `updateProduct()` - PUT /api/products/:id (требует аутентификации)
- `deleteProduct()` - DELETE /api/products/:id (требует аутентификации)

### 2. **Models** (`models/productModel.ts`)
Работают с БД через Prisma. Содержат все запросы к базе данных.

**Методы:**
- `findAll()` - получить все продукты
- `findById(id)` - получить продукт по ID
- `findByCategory(category)` - получить продукты по категории
- `create(data)` - создать новый продукт
- `update(id, data)` - обновить продукт
- `delete(id)` - удалить продукт
- `search(query)` - поиск продуктов по названию

### 3. **Routes** (`routes/productRoutes.ts`)
Определяют API endpoints и связывают их с контроллерами.

```typescript
// Публичные маршруты
GET  /api/products
GET  /api/products/:id
GET  /api/products/category/:category
GET  /api/products/search?q=query

// Защищённые маршруты (требуют Bearer токена)
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### 4. **Middleware** (`middleware/`)
- **logger.ts** - логирование всех запросов
- **errorHandler.ts** - централизованная обработка ошибок
- **auth.ts** - проверка JWT токена

### 5. **Config** (`config/`)
- **database.ts** - инициализация Prisma клиента
- **env.ts** - загрузка переменных окружения

### 6. **Types** (`types/index.ts`)
TypeScript интерфейсы и типы для всего приложения.

## 🚀 Примеры использования API

### Получить все продукты
```bash
curl http://localhost:3000/api/products
```

### Получить продукт по ID
```bash
curl http://localhost:3000/api/products/1
```

### Получить продукты по категории
```bash
curl http://localhost:3000/api/products/category/tshirts
```

### Поиск продуктов
```bash
curl "http://localhost:3000/api/products/search?q=shirt"
```

### Создать новый продукт (требует аутентификации)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "T-Shirt",
    "price": 2999,
    "image": "url",
    "category": "tshirts",
    "description": "Nice t-shirt",
    "sizes": ["S", "M", "L"],
    "composition": ["100% Cotton"]
  }'
```

### Обновить продукт (требует аутентификации)
```bash
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "price": 3499
  }'
```

### Удалить продукт (требует аутентификации)
```bash
curl -X DELETE http://localhost:3000/api/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔐 Аутентификация

Для защищённых маршрутов нужно передать JWT токен в заголовке:
```
Authorization: Bearer <token>
```

**Текущая реализация:** Простая проверка наличия токена (для демонстрации).

**TODO:** Добавить реальную проверку JWT токена с использованием библиотеки `jsonwebtoken`.

## 📝 Ответы API

### Успешный ответ
```json
{
  "success": true,
  "data": { /* данные */ },
  "message": "Operation successful"
}
```

### Ошибка
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🛠️ Как добавить новую сущность

1. **Добавить модель в Prisma** (`prisma/schema.prisma`)
2. **Создать Model** (`models/entityModel.ts`)
3. **Создать Controller** (`controllers/entityController.ts`)
4. **Создать Routes** (`routes/entityRoutes.ts`)
5. **Добавить типы** (`types/index.ts`)
6. **Подключить маршруты** в `app.ts`

## 📚 Полезные команды

```bash
# Запуск в режиме разработки
npm run dev

# Сборка проекта
npm run build

# Запуск собранного проекта
npm start

# Проверка линтера
npm run lint

# Исправление ошибок линтера
npm run lint:fix

# Генерация Prisma клиента
npx prisma generate

# Миграция БД
npx prisma migrate dev --name init
```

## 🎓 Принципы MVC

- **Model** - работает с данными и БД
- **View** - в REST API это JSON ответы
- **Controller** - обрабатывает запросы и координирует Model и View

Эта архитектура обеспечивает:
- ✅ Разделение ответственности
- ✅ Легкость тестирования
- ✅ Масштабируемость
- ✅ Переиспользование кода
