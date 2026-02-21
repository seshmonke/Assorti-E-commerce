# 🏗️ Руководство по архитектуре MVC

## 📊 Диаграмма потока данных

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP REQUEST                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Logger     │  │   Auth       │  │ Error Handler│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTES LAYER                                 │
│              (productRoutes.ts)                                 │
│  Определяет endpoints и связывает с контроллерами              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CONTROLLER LAYER                               │
│           (productController.ts)                                │
│  Обрабатывает запросы, валидирует данные,                      │
│  вызывает методы Model                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MODEL LAYER                                  │
│            (productModel.ts)                                    │
│  Работает с БД через Prisma, возвращает данные                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite)                             │
│                    (dev.db)                                     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RESPONSE LAYER                                 │
│  JSON ответ с данными или ошибкой                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Пример: Получение всех продуктов

```
1. GET /api/products
   ↓
2. Logger middleware логирует запрос
   ↓
3. productRoutes.ts маршрутизирует на ProductController.getAllProducts()
   ↓
4. ProductController.getAllProducts() вызывает ProductModel.findAll()
   ↓
5. ProductModel.findAll() выполняет prisma.product.findMany()
   ↓
6. Prisma запрашивает данные из БД
   ↓
7. Данные возвращаются в Controller
   ↓
8. Controller форматирует ответ: { success: true, data: [...] }
   ↓
9. Ответ отправляется клиенту
```

## 📂 Файловая структура с примерами

### Config Layer
```typescript
// config/database.ts
const prisma = new PrismaClient();
export default prisma;

// config/env.ts
export const config = {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'secret',
};
```

### Model Layer
```typescript
// models/productModel.ts
export class ProductModel {
    static async findAll(): Promise<IProduct[]> {
        return prisma.product.findMany();
    }
    
    static async findById(id: number): Promise<IProduct | null> {
        return prisma.product.findUnique({ where: { id } });
    }
}
```

### Controller Layer
```typescript
// controllers/productController.ts
export class ProductController {
    static async getAllProducts(req, res, next) {
        try {
            const products = await ProductModel.findAll();
            res.json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }
}
```

### Routes Layer
```typescript
// routes/productRoutes.ts
const router = Router();

router.get('/', ProductController.getAllProducts);
router.post('/', authMiddleware, ProductController.createProduct);

export default router;
```

### Middleware Layer
```typescript
// middleware/auth.ts
export function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token' });
    }
    // Проверка токена
    next();
}

// middleware/logger.ts
export function logger(req, res, next) {
    console.log(`${req.method} ${req.path}`);
    next();
}
```

## 🎯 Принципы разработки

### 1. Разделение ответственности
- **Model** - только работа с БД
- **Controller** - только обработка запросов
- **Routes** - только определение endpoints
- **Middleware** - только обработка запросов/ответов

### 2. DRY (Don't Repeat Yourself)
```typescript
// ❌ Плохо: повторение кода
app.get('/products', async (req, res) => {
    const products = await prisma.product.findMany();
    res.json(products);
});

// ✅ Хорошо: использование Model и Controller
router.get('/', ProductController.getAllProducts);
```

### 3. Error Handling
```typescript
// ✅ Правильно: используем middleware для обработки ошибок
try {
    const product = await ProductModel.findById(id);
    if (!product) {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    res.json(product);
} catch (error) {
    next(error); // Передаём в errorHandler middleware
}
```

### 4. Type Safety
```typescript
// ✅ Используем TypeScript типы
interface CreateProductDTO {
    name: string;
    price: number;
    category: ProductCategory;
}

static async createProduct(data: CreateProductDTO): Promise<IProduct> {
    return prisma.product.create({ data });
}
```

## 🚀 Как расширить приложение

### Добавление новой сущности (например, Category)

#### 1. Обновить Prisma schema
```prisma
// prisma/schema.prisma
model Category {
    id    Int     @id @default(autoincrement())
    name  String  @unique
    products Product[]
}
```

#### 2. Создать Model
```typescript
// models/categoryModel.ts
export class CategoryModel {
    static async findAll() {
        return prisma.category.findMany();
    }
    
    static async create(data: CreateCategoryDTO) {
        return prisma.category.create({ data });
    }
}
```

#### 3. Создать Controller
```typescript
// controllers/categoryController.ts
export class CategoryController {
    static async getAllCategories(req, res, next) {
        try {
            const categories = await CategoryModel.findAll();
            res.json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }
}
```

#### 4. Создать Routes
```typescript
// routes/categoryRoutes.ts
const router = Router();
router.get('/', CategoryController.getAllCategories);
router.post('/', authMiddleware, CategoryController.createCategory);
export default router;
```

#### 5. Подключить в app.ts
```typescript
import categoryRoutes from './routes/categoryRoutes.js';
app.use('/api/categories', categoryRoutes);
```

## 📋 Чек-лист для новых разработчиков

- [ ] Понимаю структуру MVC
- [ ] Знаю, где находится каждый слой
- [ ] Могу добавить новый endpoint
- [ ] Могу добавить новую сущность
- [ ] Знаю, как использовать Prisma
- [ ] Знаю, как обрабатывать ошибки
- [ ] Знаю, как использовать middleware
- [ ] Знаю, как писать типы в TypeScript

## 🔗 Полезные ссылки

- [Express.js документация](https://expressjs.com/)
- [Prisma документация](https://www.prisma.io/docs/)
- [TypeScript документация](https://www.typescriptlang.org/docs/)
- [REST API best practices](https://restfulapi.net/)

## 💡 Советы и трюки

### 1. Используйте async/await
```typescript
// ✅ Хорошо
const product = await ProductModel.findById(id);

// ❌ Плохо
ProductModel.findById(id).then(product => { ... });
```

### 2. Всегда обрабатывайте ошибки
```typescript
// ✅ Правильно
try {
    // код
} catch (error) {
    next(error);
}
```

### 3. Используйте типы
```typescript
// ✅ Правильно
const product: IProduct = await ProductModel.findById(id);

// ❌ Плохо
const product = await ProductModel.findById(id);
```

### 4. Валидируйте входные данные
```typescript
// ✅ Правильно
if (!data.name || !data.price) {
    res.status(400).json({ error: 'Missing fields' });
    return;
}
```

## 🐛 Отладка

### Логирование
```typescript
console.log('Debug:', { id, product });
```

### Использование debugger
```bash
node --inspect-brk dist/index.js
```

### Проверка типов
```bash
npm run build
```

## 📈 Производительность

- Используйте индексы в БД
- Кэшируйте часто запрашиваемые данные
- Используйте пагинацию для больших наборов данных
- Оптимизируйте Prisma запросы

## 🔒 Безопасность

- Всегда валидируйте входные данные
- Используйте JWT для аутентификации
- Не храните пароли в открытом виде
- Используйте HTTPS в production
- Ограничивайте доступ к API (rate limiting)
