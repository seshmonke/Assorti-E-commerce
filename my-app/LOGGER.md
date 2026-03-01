# Frontend Logger Documentation

## Обзор

На фронтенде добавлен встроенный логгер для отслеживания событий приложения, HTTP-запросов и ошибок авторизации.

## Структура

### Файл: `src/utils/logger.ts`

Класс `Logger` предоставляет следующие методы:

- **`info(message: string, data?: unknown)`** — информационные сообщения (синий цвет)
- **`warn(message: string, data?: unknown)`** — предупреждения (оранжевый цвет)
- **`error(message: string, data?: unknown)`** — ошибки (красный цвет)
- **`debug(message: string, data?: unknown)`** — отладочная информация (серый цвет, только в development)

### Дополнительные методы

- **`getHistory(): LogEntry[]`** — получить историю всех логов (максимум 1000 записей)
- **`clearHistory(): void`** — очистить историю логов
- **`exportLogs(): string`** — экспортировать логи в JSON формате

## Использование

### Базовое использование

```typescript
import { logger } from './utils/logger';

// Информационное сообщение
logger.info('User logged in');

// С дополнительными данными
logger.info('User logged in', { userId: '123', username: 'john' });

// Предупреждение
logger.warn('API request timeout');

// Ошибка
logger.error('Failed to fetch products', { status: 500 });

// Отладка (только в development)
logger.debug('Component mounted', { componentName: 'HomePage' });
```

## Интеграция

### 1. API Requests (`src/services/api.ts`)

Все HTTP-запросы и ответы автоматически логируются через axios interceptors:

```
[2026-02-26T20:09:00.000Z] DEBUG: [API] GET /products
[2026-02-26T20:09:01.000Z] DEBUG: [API] Response 200 /products
```

### 2. Authentication (`src/store/authSlice.ts`)

События авторизации логируются в Redux reducers:

```
[2026-02-26T20:09:00.000Z] INFO: [Auth] Sign in pending
[2026-02-26T20:09:01.000Z] INFO: [Auth] Sign in successful
[2026-02-26T20:09:02.000Z] WARN: [Auth] Sign in failed
```

### 3. App Initialization (`src/App.tsx`)

Предупреждения о Telegram SDK логируются:

```
[2026-02-26T20:09:00.000Z] WARN: Telegram Web App SDK not available
```

## Форматирование

Все логи форматируются с временной меткой ISO 8601:

```
[2026-02-26T20:09:00.000Z] INFO: message {data}
```

## Консоль

В браузерной консоли логи отображаются с цветным форматированием:

- **INFO** — синий цвет, жирный
- **WARN** — оранжевый цвет, жирный
- **ERROR** — красный цвет, жирный
- **DEBUG** — серый цвет, обычный (только в development)

## Development vs Production

- **Development** (`import.meta.env.DEV === true`):
  - Все уровни логирования включены
  - Debug логи выводятся в консоль

- **Production** (`import.meta.env.DEV === false`):
  - Debug логи подавляются
  - Остаются info, warn, error

## Экспорт логов

Для отладки можно экспортировать логи в консоли:

```typescript
import { logger } from './utils/logger';

// В консоли браузера
console.log(logger.exportLogs());

// Или получить массив
const logs = logger.getHistory();
```

## Примеры

### Логирование ошибок API

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('[API] Request failed', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });
    return Promise.reject(error);
  }
);
```

### Логирование действий пользователя

```typescript
function handleAddToCart(productId: string) {
  logger.info('Product added to cart', { productId });
  dispatch(addToCart(productId));
}
```

### Логирование состояния Redux

```typescript
function handleCheckout() {
  const cart = useAppSelector(state => state.cart);
  logger.debug('Checkout initiated', { itemsCount: cart.items.length });
  // ...
}
```
