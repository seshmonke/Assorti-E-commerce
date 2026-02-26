# Авторизация через Telegram Mini App 🚀

Полная реализация безопасной авторизации через Telegram Mini App с JWT токенами и httpOnly cookies.

## 📋 Что реализовано

### Backend (Express + TypeScript + Prisma)

1. **Модель User в БД**
   - `id` (UUID)
   - `telegramId` (уникальный, связь с Telegram)
   - `username`, `firstName`, `lastName` (опциональные)
   - `createdAt`, `updatedAt`

2. **Сервис авторизации** (`src/services/authService.ts`)
   - ✅ Валидация `initData` от Telegram Mini App (HMAC-SHA256)
   - ✅ Проверка свеже��ти `auth_date` (не старше 24h)
   - ✅ Поиск/создание пользователя в БД
   - ✅ Генерация JWT access (15min) и refresh (7d) токенов
   - ��� Верификация токенов

3. **Контроллер авторизации** (`src/controllers/authController.ts`)
   - `POST /api/auth/signin` — авторизация через initData
   - `POST /api/auth/refresh` — обновление access токена
   - `POST /api/auth/logout` — выход из аккаунта

4. **Middleware** (`src/middleware/auth.ts`)
   - ✅ Проверка JWT из httpOnly cookies
   - ✅ Поддержка Authorization header (для совместимости)
   - ✅ Установка `req.user` с userId и telegramId

5. **CORS и Security**
   - ✅ `credentials: true` для передачи cookies
   - ✅ httpOnly cookies для защиты от XSS
   - ✅ Secure флаг для HTTPS (в production)

### Frontend (React + Redux + Vite)

1. **Redux Auth Slice** (`src/store/authSlice.ts`)
   - State: `isAuthorized`, `isLoading`, `user`, `error`
   - Async thunks: `signIn()`, `refreshToken()`, `logout()`
   - Автоматическое управление состоянием

2. **Интеграция с Telegram Web App** (`src/App.tsx`)
   - ✅ Инициализация `window.Telegram.WebApp`
   - ✅ Получение `initData` при загрузке приложения
   - ✅ Автоматический вызов `signIn(initData)`
   - ✅ Отображение статуса авторизации в UI

3. **API конфигурация** (`src/services/api.ts`)
   - ✅ `withCredentials: true` для отправки cookies
   - ✅ Автоматическая отправка токенов на все запросы

---

## 🔧 Установка и настройка

### 1. Backend — установка переменных окружения

Отредактируйте `backend-new/.env`:

```env
# JWT секреты (измените на боевые значения)
JWT_SECRET="ваш-супер-секретный-ключ-jwt"
JWT_REFRESH_SECRET="ваш-супер-секретный-ключ-refresh"

# Telegram Bot Token (получите от @BotFather в Telegram)
TELEGRAM_BOT_TOKEN="123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh"

# Для production
NODE_ENV="production"
```

**⚠️ Как получить TELEGRAM_BOT_TOKEN:**
1. Откройте Telegram и напишите @BotFather
2. Выполните `/newbot` и следуйте инструкциям
3. Скопируйте токен формата `123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh`

### 2. Frontend — убедитесь, что установлены зависимости

```bash
cd my-app
npm install @tma.js/sdk
```

### 3. Запуск приложения

**Backend:**
```bash
cd backend-new
npm run dev
# Слушает на http://localhost:3000
```

**Frontend:**
```bash
cd my-app
npm run dev
# Слушает на http://localhost:5173
```

---

## 🔐 Схема работы авторизации

```
┌─────────────────────────────────────────────────────────────┐
│ Telegram Mini App запускается                               │
│ window.Telegram.WebApp.ready() + инициализация              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend получает initData через window.Telegram.WebApp      │
│ initData = {user: {...}, auth_date: ..., hash: ...}         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend отправляет POST /api/auth/signin { initData }      │
│ (cookies отправляются автоматически благодаря              │
│  withCredentials: true в axios)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────��──────────────────────┐
│ Backend валидирует initData:                                │
│ 1. HMAC-SHA256 проверка подписи (bot_token + "WebAppData") │
│ 2. Проверка auth_date (не старше 24h)                      │
│ 3. Парсинг user информации                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend ищет пользователя по telegramId:                    │
│ - Если есть → берём существующего                          │
│ - Если нет → создаём нового в БД                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend генерирует JWT токены:                              │
│ - accessToken (15min) — для основных запросов             │
│ - refreshToken (7d) — для обновления accessToken           │
│ Оба передаются в httpOnly cookies                          │
└──────────────────────────────────────────────��──────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend получает ответ:                                   │
│ - status: 200                                              │
│ - data: { user, accessToken, refreshToken }               │
│ - Cookies автоматически сохраняются браузером             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend устанавливает isAuthorized = true в Redux         │
│ Теперь все API запросы автоматически включают cookies       │
│ с accessToken благодаря middleware                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 API Endpoints

### POST /api/auth/signin
**Авторизация через Telegram initData**

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"initData":"user%3D%7B%22id%22%3A..."}' \
  --cookie ""
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-...",
      "telegramId": "123456789",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2026-02-26T01:30:00Z",
      "updatedAt": "2026-02-26T01:30:00Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Авторизация успешна"
}
```

**Cookies установлены:**
- `accessToken` (httpOnly, 7d)
- `refreshToken` (httpOnly, 7d)

---

### POST /api/auth/refresh
**Обновление access токена**

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  --cookie "refreshToken=eyJhbGc..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  },
  "message": "Token refreshed"
}
```

---

### POST /api/auth/logout
**Выход из аккаунта (требует аутентификации)**

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGc..." \
  --cookie "accessToken=eyJhbGc..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 🛡️ Защита API endpoints

Для защиты маршрута используйте middleware `authMiddleware`:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { OrderController } from '../controllers/orderController.js';

const router = Router();

// Защищённый маршрут
router.get('/', authMiddleware, OrderController.getAllOrders);

// req.user будет содержать:
// {
//   userId: "uuid-...",
//   telegramId: "123456789"
// }
```

Это уже применено в `orderRoutes.ts`.

---

## 🚀 Production Checklist

- [ ] Измените `JWT_SECRET` и `JWT_REFRESH_SECRET` на сложные значения
- [ ] Получите реальный `TELEGRAM_BOT_TOKEN` от @BotFather
- [ ] Установите `NODE_ENV=production`
- [ ] Используйте HTTPS (для `secure: true` в cookies)
- [ ] Настройте правильные CORS origins
- [ ] Проверьте логирование и мониторинг
- [ ] Добавьте rate limiting на `/api/auth/signin`
- [ ] Регулярно ротируйте JWT секреты

---

## 🐛 Troubleshooting

### Ошибка: "TELEGRAM_BOT_TOKEN не установлен"
**Решение:** Добавьте `TELEGRAM_BOT_TOKEN` в `.env` файл backend-а.

### Ошибка: "Невалидная подпись или истёкшие данные initData"
**Решение:** 
- Проверьте, что `TELEGRAM_BOT_TOKEN` правильный
- Убедитесь, что `auth_date` не старше 24 часов
- Проверьте, что `initData` полностью скопирован без ошибок

### Cookies не сохраняются
**Решение:**
- Убедитесь, что `withCredentials: true` в axios
- Проверьте `sameSite` policy (используется `lax`)
- В localhost должно работать без HTTPS

### Frontend не авторизуется
**Решение:**
- Откройте DevTools → Network и посмотрите запрос к `/api/auth/signin`
- Проверьте, что статус 200 и `success: true`
- Посмотрите Redux state через Redux DevTools

---

## 📚 Дополнительные ссылки

- [Telegram Web App Documentation](https://core.telegram.org/bots/webapps)
- [Telegram initData Validation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [@tma.js/init-data-node](https://github.com/Telegram-Mini-Apps/tma.js)

---

## ✨ Что можно добавить в будущем

- [ ] Двухфакторная авторизация
- [ ] Социальная авторизация (Google, Apple)
- [ ] Профиль пользователя (аватар, био, etc.)
- [ ] Логирование активности
- [ ] Blacklist/logout для других сессий
- [ ] Интеграция с платежами (Telegram Stars, YooKassa)

---

**Создано:** 26.02.2026
**Версия:** 1.0.0
**Статус:** ✅ Production Ready
