# 🧪 Примеры использования API

## 📌 Базовая информация

- **Base URL:** `http://localhost:3000`
- **Content-Type:** `application/json`
- **Authentication:** Bearer Token в заголовке `Authorization`

## 🔓 Публичные endpoints (без аутентификации)

### 1. Получить все продукты

```bash
curl -X GET http://localhost:3000/api/products
```

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-Shirt",
      "price": 2999,
      "image": "https://example.com/tshirt.jpg",
      "category": "tshirts",
      "description": "Comfortable cotton t-shirt",
      "sizes": ["S", "M", "L", "XL"],
      "composition": ["100% Cotton"],
      "discount": null,
      "originalCategory": null,
      "createdAt": "2026-02-21T19:00:00.000Z",
      "updatedAt": "2026-02-21T19:00:00.000Z"
    }
  ]
}
```

### 2. Получить продукт по ID

```bash
curl -X GET http://localhost:3000/api/products/1
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "T-Shirt",
    "price": 2999,
    ...
  }
}
```

**Ошибка (продукт не найден):**
```json
{
  "success": false,
  "error": "Product not found"
}
```

### 3. Получить продукты по категории

```bash
curl -X GET http://localhost:3000/api/products/category/tshirts
```

**Параметры категорий:**
- `all` - все
- `tshirts` - футболки
- `jeans` - джинсы
- `jackets` - куртки
- `hats` - шапки
- `belts` - ремни
- `glasses` - очки
- `shoes` - обувь
- `bags` - сумки
- `sale` - распродажа

**Ответ:**
```json
{
  "success": true,
  "data": [
    { /* продукты категории tshirts */ }
  ]
}
```

### 4. Поиск продуктов

```bash
curl -X GET "http://localhost:3000/api/products/search?q=shirt"
```

**Параметры:**
- `q` (обязательный) - поисковый запрос

**Ответ:**
```json
{
  "success": true,
  "data": [
    { /* продукты, содержащие "shirt" в названии */ }
  ]
}
```

**Ошибка (нет поискового запроса):**
```json
{
  "success": false,
  "error": "Search query is required"
}
```

## 🔐 Защищённые endpoints (требуют аутентификации)

### Получение токена

Для тестирования используйте любой Bearer токен. В текущей реализации проверяется только наличие токена.

```bash
# Пример токена для тестирования
BEARER_TOKEN="test-token-12345"
```

### 5. Создать новый продукт

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-12345" \
  -d '{
    "name": "Blue Jeans",
    "price": 4999,
    "image": "https://example.com/jeans.jpg",
    "category": "jeans",
    "description": "Classic blue denim jeans",
    "sizes": ["28", "30", "32", "34", "36"],
    "composition": ["98% Cotton", "2% Elastane"],
    "discount": 10,
    "originalCategory": "jeans"
  }'
```

**Обязательные поля:**
- `name` (string) - название продукта
- `price` (number) - цена в копейках
- `image` (string) - URL изображения
- `category` (string) - категория
- `description` (string) - описание
- `sizes` (array) - размеры
- `composition` (array) - состав

**Опциональные поля:**
- `discount` (number) - скидка в процентах
- `originalCategory` (string) - оригинальная категория

**Ответ (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Blue Jeans",
    "price": 4999,
    ...
  },
  "message": "Product created successfully"
}
```

**Ошибка (отсутствуют обязательные поля):**
```json
{
  "success": false,
  "error": "Missing required fields: name, price, category"
}
```

**Ошибка (нет токена):**
```json
{
  "success": false,
  "error": "Missing or invalid authorization header"
}
```

### 6. Обновить продукт

```bash
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-12345" \
  -d '{
    "price": 3499,
    "discount": 15
  }'
```

**Параметры:**
- Все поля опциональны
- Обновляются только переданные поля

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "T-Shirt",
    "price": 3499,
    "discount": 15,
    ...
  },
  "message": "Product updated successfully"
}
```

### 7. Удалить продукт

```bash
curl -X DELETE http://localhost:3000/api/products/1 \
  -H "Authorization: Bearer test-token-12345"
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "T-Shirt",
    ...
  },
  "message": "Product deleted successfully"
}
```

## 🧪 Примеры с использованием Postman

### Импорт коллекции

Создайте новую коллекцию в Postman и добавьте следующие запросы:

#### GET - Все продукты
```
Method: GET
URL: {{base_url}}/api/products
```

#### GET - Продукт по ID
```
Method: GET
URL: {{base_url}}/api/products/1
```

#### GET - Продукты по категории
```
Method: GET
URL: {{base_url}}/api/products/category/tshirts
```

#### GET - Поиск
```
Method: GET
URL: {{base_url}}/api/products/search?q=shirt
```

#### POST - Создать продукт
```
Method: POST
URL: {{base_url}}/api/products
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
{
  "name": "New Product",
  "price": 2999,
  "image": "https://example.com/product.jpg",
  "category": "tshirts",
  "description": "Product description",
  "sizes": ["S", "M", "L"],
  "composition": ["100% Cotton"]
}
```

#### PUT - Обновить продукт
```
Method: PUT
URL: {{base_url}}/api/products/1
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
{
  "price": 3499
}
```

#### DELETE - Удалить продукт
```
Method: DELETE
URL: {{base_url}}/api/products/1
Headers:
  Authorization: Bearer {{token}}
```

## 🧪 Примеры с использованием JavaScript/Fetch

### Получить все продукты
```javascript
fetch('http://localhost:3000/api/products')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Создать продукт
```javascript
const token = 'test-token-12345';

fetch('http://localhost:3000/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'New T-Shirt',
    price: 2999,
    image: 'https://example.com/tshirt.jpg',
    category: 'tshirts',
    description: 'Comfortable t-shirt',
    sizes: ['S', 'M', 'L'],
    composition: ['100% Cotton']
  })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Обновить продукт
```javascript
const token = 'test-token-12345';
const productId = 1;

fetch(`http://localhost:3000/api/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    price: 3499,
    discount: 10
  })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Удалить продукт
```javascript
const token = 'test-token-12345';
const productId = 1;

fetch(`http://localhost:3000/api/products/${productId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

## 🧪 Примеры с использованием axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Получить все продукты
api.get('/products')
  .then(res => console.log(res.data))
  .catch(err => console.error(err));

// Создать продукт
api.post('/products', {
  name: 'New Product',
  price: 2999,
  image: 'url',
  category: 'tshirts',
  description: 'Description',
  sizes: ['S', 'M'],
  composition: ['100% Cotton']
}, {
  headers: {
    'Authorization': 'Bearer token'
  }
})
  .then(res => console.log(res.data))
  .catch(err => console.error(err));
```

## 📊 Коды ответов

| Код | Описание |
|-----|---------|
| 200 | OK - успешный запрос |
| 201 | Created - ресурс создан |
| 400 | Bad Request - ошибка в запросе |
| 401 | Unauthorized - требуется аутентификация |
| 404 | Not Found - ресурс не найден |
| 500 | Internal Server Error - ошибка сервера |

## 🔍 Отладка

### Проверить логи сервера
```bash
npm run dev
```

### Проверить структуру ответа
```bash
curl -X GET http://localhost:3000/api/products | jq
```

### Проверить заголовки ответа
```bash
curl -i -X GET http://localhost:3000/api/products
```

## 💡 Советы

1. **Используйте переменные окружения** для хранения токенов
2. **Проверяйте статус ответа** перед обработкой данных
3. **Обрабатывайте ошибки** в try-catch блоках
4. **Логируйте запросы** для отладки
5. **Используйте инструменты** типа Postman или Insomnia для тестирования

## 🚀 Запуск сервера

```bash
# Режим разработки
npm run dev

# Production
npm run build
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`
