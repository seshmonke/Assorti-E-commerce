# 🎯 Backend AssortiShop - MVC Архитектура

Полностью организованный бэкенд на Express.js + TypeScript с архитектурой MVC.

## 📋 Содержание

- [Быстрый старт](#-быстрый-старт)
- [Структура проекта](#-структура-проекта)
- [Архитектура](#-архитектура)
- [API Endpoints](#-api-endpoints)
- [Примеры использования](#-примеры-использования)
- [Разработка](#-разработка)
- [Документация](#-документация)

## 🚀 Быстрый старт

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```

Сервер будет доступен по адресу: `http://localhost:3000`

### Сборка проекта
```bash
npm run build
```

### Запуск собранного проекта
```bash
npm start
```

## 📁 Структура проекта

```
backend-new/
├── src/
│   ├── config/                 # Конфигурация
│   │   ├── database.ts        # Prisma клиент
│   │   └── env.ts             # Переменные окружения
│   ├── controllers/           # Контроллеры (обработка запросов)
│   │   └── productController.ts
│   ├── models/                # Модели (работа с БД)
│   │   └── productModel.ts
│   ├── routes/                # Маршруты
│   │   └── productRoutes.ts
│   ├── middleware/            # Middleware
│   │   ├── logger.ts
│   │   ├── errorHandler.ts
│   │   └── auth.ts
│   ├── utils/                 # Утилиты
│   │   └── helpers.ts
│   ├── types/                 # TypeScript типы
│   │   └── index.ts
│   ├── app.ts                 # Инициализация Express
│   └── index.ts               # Точка входа
├── prisma/
│   ├── schema.prisma          # Prisma схема БД
│   └── migrations/            # Миграции БД
├── dist/                      # Скомпилированный код
├── package.json
├── tsconfig.json
└── README_MVC.md              # Этот файл
```

## 🏗️ Архитектура

### MVC Pattern

```
Request → Routes → Controller → Model → Database
                      ↓
                   Response
```

### Слои приложения

1. **Routes** - определяют endpoints и связывают с контроллерами
2. **Controllers** - обрабатывают запросы и вызывают модели
3. **Models** - работают с БД через Prisma
4. **Middleware** - обработка запросов (логирование, аутентификация, ошибки)
5. **Config** - конфигурация приложения
6. **Types** - TypeScript типы и интерфейсы

## 📡 API Endpoints

### Публичные (без аутентификации)

| Метод | Endpoint | Описание |
|-------|----------|---------|
| GET | `/api/products` | Получить все продукты |
| GET | `/api/products/:id` | Получить продукт по ID |
| GET | `/api/products/category/:category` | Получить продукты по категории |
| GET | `/api/products/search?q=query` | Поиск продуктов |

### Защищённые (требуют Bearer токена)

| Метод | Endpoint | Описание |
|-------|----------|---------|
| POST | `/api/products` | Создать новый продукт |
| PUT | `/api/products/:id` | Обновить продукт |
| DELETE | `/api/products/:id` | Удалить продукт |

## 🧪 Примеры использования

### Получить все продукты
```bash
curl http://localhost:3000/api/products
```

### Создать продукт
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

### Обновить продукт
```bash
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"price": 3499}'
```

### Удалить продукт
```bash
curl -X DELETE http://localhost:3000/api/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 💻 Разработка

### Команды

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

# Открыть Prisma Studio
npx prisma studio
```

### Добавление новой сущности

1. **Обновить Prisma schema** (`prisma/schema.prisma`)
2. **Создать Model** (`models/entityModel.ts`)
3. **Создать Controller** (`controllers/entityController.ts`)
4. **Создать Routes** (`routes/entityRoutes.ts`)
5. **Добавить типы** (`types/index.ts`)
6. **Подключить маршруты** в `app.ts`

### Структура файла Model

```typescript
import prisma from '../config/database.js';
import type { CreateEntityDTO, UpdateEntityDTO, IEntity } from '../types/index.js';

export class EntityModel {
    static async findAll(): Promise<IEntity[]> {
        return prisma.entity.findMany();
    }

    static async findById(id: number): Promise<IEntity | null> {
        return prisma.entity.findUnique({ where: { id } });
    }

    static async create(data: CreateEntityDTO): Promise<IEntity> {
        return prisma.entity.create({ data });
    }

    static async update(id: number, data: UpdateEntityDTO): Promise<IEntity> {
        return prisma.entity.update({ where: { id }, data });
    }

    static async delete(id: number): Promise<IEntity> {
        return prisma.entity.delete({ where: { id } });
    }
}
```

### Структура файла Controller

```typescript
import type { Request, Response, NextFunction } from 'express';
import { EntityModel } from '../models/entityModel.js';
import type { CreateEntityDTO, UpdateEntityDTO, ApiResponse } from '../types/index.js';

export class EntityController {
    static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const entities = await EntityModel.findAll();
            const response: ApiResponse<typeof entities> = {
                success: true,
                data: entities,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const entity = await EntityModel.findById(Number(id));

            if (!entity) {
                res.status(404).json({ success: false, error: 'Not found' });
                return;
            }

            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data: CreateEntityDTO = req.body;
            const entity = await EntityModel.create(data);
            res.status(201).json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const data: UpdateEntityDTO = req.body;
            const entity = await EntityModel.update(Number(id), data);
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const entity = await EntityModel.delete(Number(id));
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }
}
```

### Структура файла Routes

```typescript
import { Router } from 'express';
import { EntityController } from '../controllers/entityController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Публичные маршруты
router.get('/', EntityController.getAll);
router.get('/:id', EntityController.getById);

// Защищённые маршруты
router.post('/', authMiddleware, EntityController.create);
router.put('/:id', authMiddleware, EntityController.update);
router.delete('/:id', authMiddleware, EntityController.delete);

export default router;
```

## 📚 Документация

- **[MVC_STRUCTURE.md](./MVC_STRUCTURE.md)** - Подробное описание структуры MVC
- **[ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)** - Руководство по архитектуре и принципам разработки
- **[API_EXAMPLES.md](./API_EXAMPLES.md)** - Примеры использования API

## 🔐 Аутентификация

Для защищённых маршрутов передайте JWT токен в заголовке:

```
Authorization: Bearer <token>
```

**Текущая реализация:** Простая проверка наличия токена.

**TODO:** Добавить реальную проверку JWT с использованием `jsonwebtoken`.

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

## 🛠️ Технологический стек

- **Express.js** - веб-фреймворк
- **TypeScript** - типизированный JavaScript
- **Prisma** - ORM для работы с БД
- **SQLite** - база данных
- **ESLint** - линтер кода
- **tsx** - TypeScript executor

## 📦 Зависимости

```json
{
  "dependencies": {
    "@prisma/adapter-better-sqlite3": "^7.4.0",
    "@prisma/client": "^7.4.0",
    "dotenv": "^17.3.1",
    "express": "^5.2.1"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/node": "^25.3.0",
    "typescript": "^5.9.3",
    "tsx": "^4.21.0"
  }
}
```

## 🎓 Принципы разработки

- ✅ **Разделение ответственности** - каждый слой отвечает за свою задачу
- ✅ **DRY** - не повторяй себя
- ✅ **Type Safety** - используй TypeScript типы
- ✅ **Error Handling** - обрабатывай ошибки правильно
- ✅ **Scalability** - архитектура легко расширяется

## 🐛 Отладка

### Логирование
```bash
npm run dev
```

Все запросы будут логироваться в консоль.

### Проверка типов
```bash
npm run build
```

### Использование debugger
```bash
node --inspect-brk dist/index.js
```

## 🚀 Развёртывание

### Production сборка
```bash
npm run build
npm start
```

### Переменные окружения
Создайте файл `.env`:
```
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key
DATABASE_URL=file:./prod.db
```

## 📞 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте документацию в папке
2. Посмотрите примеры в `API_EXAMPLES.md`
3. Проверьте логи сервера
4. Используйте инструменты отладки

## 📄 Лицензия

ISC

## 👨‍💻 Автор

AssortiShop Team

---

**Последнее обновление:** 21.02.2026

**Версия:** 1.0.0
