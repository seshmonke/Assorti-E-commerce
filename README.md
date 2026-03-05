# [ASSORTI — Fullstack E-Commerce Platform](https://assortishop.online)

Fullstack-платформа интернет-магазина одежды и аксессуаров с Telegram Mini App, REST API и Telegram-ботом для администрирования.

## Стек технологий

### Backend (`backend-new/`)
- **Runtime:** Node.js + TypeScript (ESModules)
- **Framework:** Express 5
- **ORM:** Prisma 7 + SQLite (better-sqlite3)
- **Авторизация:** JWT + Telegram Mini App (`@tma.js/init-data-node`)
- **Платежи:** ЮKassa (YooKassa)
- **Доставка:** СДЭК API v2
- **Архитектура:** MVC (Models / Controllers / Routes / Services)
- **Логирование:** кастомный middleware + файловые логи

### Frontend (`my-app/`)
- **Framework:** React 19 + TypeScript
- **Сборка:** Vite 7
- **State management:** Redux Toolkit
- **Роутинг:** React Router 7
- **UI:** Bootstrap 5
- **Telegram:** `@tma.js/sdk` (Telegram Mini App)
- **Формы:** Formik + Yup
- **QR-сканер:** jsQR (WebApp-сканер в браузере)
- **Галерея:** react-image-gallery

### Telegram Admin Bot (`telegram-admin-bot/`)
- **Framework:** grammY + `@grammyjs/conversations`
- **Язык:** TypeScript
- **Функции:** управление товарами, категориями, заказами, архивом; генерация и сканирование QR-кодов; печать этикеток
- **QR:** qrcode + jsQR + canvas + jimp
- **Процесс:** PM2

### Тесты (`__tests__/`)
- **Framework:** Vitest 3
- **Покрытие:** backend controllers, middleware, frontend store, utils
- **Окружение:** jsdom (для React-компонентов)

---

## Структура проекта

```
sofar5/
├── backend-new/          # Express API сервер
│   ├── prisma/           # Схема БД и миграции
│   ├── src/
│   │   ├── controllers/  # Обработчики запросов
│   │   ├── models/       # Prisma-запросы (слой данных)
│   │   ├── routes/       # Маршруты API
│   │   ├── services/     # Бизнес-логика (CDEK, YooKassa)
│   │   ├── middleware/   # Auth, logger, errorHandler
│   │   └── utils/        # Вспомогательные утилиты
│   └── generated/        # Prisma Client (генерируется)
│
├── my-app/               # React SPA (Telegram Mini App)
│   ├── public/           # Статика (QR-сканер HTML)
│   └── src/
│       ├── components/   # CartModal, ProductList
│       ├── pages/        # Home, Category, Product, Cart, Payment, Order, Profile
│       ├── store/        # Redux slices (cart, auth, categories)
│       ├── services/     # API-клиент (axios)
│       └── utils/        # Логгер, нормализация данных
│
├── telegram-admin-bot/   # Telegram-бот администратора
│   └── src/
│       ├── conversations/ # Диалоги: товары, категории, заказы, архив, QR
│       ├── services/      # QR-генерация, сканирование, этикетки
│       ├── keyboards/     # Клавиатуры меню
│       └── handlers/      # Обработчики событий
│
├── __tests__/            # Тесты (Vitest)
│   ├── backend/          # Тесты контроллеров и middleware
│   ├── frontend/         # Тесты store и utils
│   └── fixtures/         # Тестовые данные
│
└── deploy.sh             # Скрипт деплоя (frontend + backend + PM2 + Nginx)
```

---

## API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/auth/signin` | Авторизация через Telegram initData |
| `GET` | `/api/products` | Список товаров |
| `GET` | `/api/products/:id` | Товар по ID |
| `POST` | `/api/products` | Создать товар |
| `PUT` | `/api/products/:id` | Обновить товар |
| `DELETE` | `/api/products/:id` | Удалить товар |
| `GET` | `/api/categories` | Список категорий |
| `POST` | `/api/categories` | Создать категорию |
| `GET` | `/api/orders` | Список заказов |
| `POST` | `/api/orders` | Создать заказ |
| `GET` | `/api/orders/:id` | Заказ по ID |
| `POST` | `/api/payments/create` | Создать платёж (ЮKassa) |
| `POST` | `/api/payments/webhook` | Webhook от ЮKassa |
| `GET` | `/api/cdek/cities` | Поиск городов СДЭК |
| `GET` | `/api/cdek/pvz` | Список ПВЗ по городу |
| `POST` | `/api/cdek/calculate` | Расчёт стоимости доставки |
| `GET` | `/api/health` | Health check |

---

## Запуск

### Backend

```bash
cd backend-new
npm install
npx prisma generate
npx prisma migrate dev
npm run dev        # dev-режим (tsx watch)
npm run build      # сборка TypeScript
npm start          # production
```

### Frontend

```bash
cd my-app
npm install
npm run dev        # Vite dev server (localhost:5173)
npm run build      # production build
npm run preview    # preview production build
```

### Telegram Bot

```bash
cd telegram-admin-bot
npm install
npm run dev        # dev-режим (tsx watch)
npm run build      # сборка TypeScript
npm start          # production
npm run pm2        # build + PM2 restart
```

### Тесты

```bash
# Из корня проекта
npm test                    # все тесты (watch)
npm run test:run            # все тесты (однократно)
npm run test:coverage       # с отчётом покрытия
npm run test:backend        # только backend
npm run test:frontend       # только frontend
```

---

## Деплой

```bash
bash deploy.sh
```

Скрипт выполняет:
1. Сборку Telegram-бота
2. `git pull` + `npm ci` + `vite build` фронтенда → копирование в `/var/www/my-app`
3. `git pull` + `npm ci` + `prisma migrate deploy` + сборку бэкенда
4. Перезапуск PM2-процессов (`backend`, `telegram-bot`)
5. Reload Nginx

Опционально отправляет уведомления в Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).

---

## Переменные окружения

### Backend (`backend-new/.env`)

```env
DATABASE_URL="file:./prod.db"
JWT_SECRET=your_jwt_secret
TELEGRAM_BOT_TOKEN=your_bot_token
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
CDEK_CLIENT_ID=your_cdek_client_id
CDEK_CLIENT_SECRET=your_cdek_client_secret
CORS_ORIGIN=https://your-frontend-domain.com
PORT=3000
```

### Frontend (`my-app/.env`)

```env
VITE_API_URL=https://your-api-domain.com
```

### Telegram Bot (`telegram-admin-bot/.env`)

```env
BOT_API_KEY=your_telegram_bot_token
ALLOWED_USER_IDS=123456789,987654321
API_URL=https://your-api-domain.com
```

---

## Модели данных

- **Product** — товар (название, цена, изображения, категория, описание, размеры, состав, скидка, архив)
- **Category** — категория (название, секция: `clothing` | `accessories`, порядок)
- **Order** — заказ (позиции, сумма, статус, способ оплаты, доставка СДЭК, трек-номер)
- **OrderItem** — позиция заказа (товар, количество, цена на момент заказа)
- **BrowserUser** — покупатель (имя, телефон, email, Telegram)
- **User** — Telegram-пользователь (авторизация через Mini App)
