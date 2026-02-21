# 🚀 Быстрый старт

## ⚡ За 5 минут до первого запроса

### 1. Установка зависимостей
```bash
cd backend-new
npm install
```

### 2. Запуск сервера
```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

### 3. Первый запрос
```bash
curl http://localhost:3000/api/products
```

## 📚 Документация

| Файл | Описание |
|------|---------|
| **README_MVC.md** | Основная документация |
| **MVC_STRUCTURE.md** | Структура MVC |
| **ARCHITECTURE_GUIDE.md** | Руководство по архитектуре |
| **API_EXAMPLES.md** | Примеры API |
| **SETUP_SUMMARY.md** | Сводка всего сделанного |

## 🎯 Основные команды

```bash
npm run dev          # Разработка
npm run build        # Сборка
npm start            # Production
npm run lint         # Проверка кода
npm run lint:fix     # Исправление кода
```

## 📡 API Endpoints

### Получить все продукты
```bash
curl http://localhost:3000/api/products
```

### Получить продукт по ID
```bash
curl http://localhost:3000/api/products/1
```

### Поиск
```bash
curl "http://localhost:3000/api/products/search?q=shirt"
```

### Создать продукт (требует токена)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
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

## 🏗️ Структура проекта

```
src/
├── config/          # Конфигурация
├── controllers/     # Обработка запросов
├── models/          # Работа с БД
├── routes/          # API endpoints
├── middleware/      # Логирование, ошибки, аутентификация
├── types/           # TypeScript типы
├── utils/           # Вспомогательные функции
├── app.ts           # Express приложение
└── index.ts         # Точка входа
```

## 🔐 Аутентификация

Для защищённых endpoints передайте токен:
```
Authorization: Bearer YOUR_TOKEN
```

## 📝 Ответ API

```json
{
  "success": true,
  "data": { /* данные */ },
  "message": "Operation successful"
}
```

## 🛠️ Добавление новой сущности

1. Обновить `prisma/schema.prisma`
2. Создать `models/entityModel.ts`
3. Создать `controllers/entityController.ts`
4. Создать `routes/entityRoutes.ts`
5. Добавить типы в `types/index.ts`
6. Подключить в `app.ts`

## 💡 Советы

- Используйте `npm run dev` для разработки
- Проверяйте логи в консоли
- Используйте Postman для тестирования
- Читайте документацию для деталей

## 🆘 Помощь

1. Проверьте `README_MVC.md`
2. Посмотрите `API_EXAMPLES.md`
3. Изучите `ARCHITECTURE_GUIDE.md`
4. Проверьте логи сервера

---

**Готово к разработке!** 🎉
