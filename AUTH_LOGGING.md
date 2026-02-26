# Логирование авторизации

## Обзор

В приложении реализовано полное логирование всех событий авторизации. Логи пишутся в отдельный файл `logs/auth.log` с привязкой к IP адресу, временным меткам и деталями события.

## Структура логирования

### Файлы

- **`backend-new/src/utils/authLogger.ts`** — утилита для логирования авторизации с функциями для каждого события
- **`backend-new/src/controllers/authController.ts`** — контроллер авторизации с добавленным логированием
- **`backend-new/src/middleware/auth.ts`** — middleware проверки токенов с логированием отказов

### Места логирования

#### 1. SignIn (`POST /api/auth/signin`)
- ✅ **SIGNIN_SUCCESS** — успешная авторизация
  - Логируется: `telegramId`, `username`, IP адрес
  - Уровень: INFO
- ❌ **SIGNIN_FAILED** — ошибка авторизации
  - Логируется: причина ошибки, IP адрес
  - Уровень: WARN
  - Триггеры: невалидная подпись, ошибка сервера

#### 2. Token Refresh (`POST /api/auth/refresh`)
- ✅ **TOKEN_REFRESHED** — успешное обновление токена
  - Логируется: `userId`, IP адрес
  - Уровень: INFO
- ❌ **REFRESH_FAILED** — ошибка при обновлении
  - Логируется: причина ошибки, IP адрес
  - Уровень: WARN
  - Триггеры: отсутствие токена, невалидный токен, ошибка сервера

#### 3. Logout (`POST /api/auth/logout`)
- ✅ **LOGOUT** — выход из системы
  - Логируется: `userId`, IP адрес
  - Уровень: INFO

#### 4. Auth Middleware (`authMiddleware`)
- ❌ **AUTH_DENIED** — отказ в доступе к защищённому роуту
  - Логируется: причина, HTTP метод, путь, IP адрес
  - Уровень: WARN
  - Триггеры:
    - Missing authentication token (токен не передан)
    - Invalid or expired token (токен невалидный или истёк)
    - Любые ошибки при проверке токена

## Примеры логов

```
[2026-02-26T10:53:00.000Z] INFO  SIGNIN_SUCCESS    | telegramId: 123456789 | IP: 127.0.0.1 | User: seshmonke
[2026-02-26T10:53:01.000Z] WARN  SIGNIN_FAILED     | IP: 127.0.0.1 | Reason: Invalid initData signature
[2026-02-26T10:54:00.000Z] WARN  AUTH_DENIED       | IP: 127.0.0.1 | Path: GET /api/products | Reason: Missing token
[2026-02-26T10:55:00.000Z] INFO  TOKEN_REFRESHED   | userId: abc-123-def | IP: 127.0.0.1
[2026-02-26T10:56:00.000Z] INFO  LOGOUT            | userId: abc-123-def | IP: 127.0.0.1
[2026-02-26T10:57:00.000Z] WARN  REFRESH_FAILED    | IP: 192.168.1.100 | Reason: Invalid refresh token
[2026-02-26T10:58:00.000Z] WARN  AUTH_DENIED       | IP: 192.168.1.100 | Path: POST /api/orders | Reason: token expired
```

## Расположение логов

```
backend-new/logs/
├── app.log       # Общие логи всех HTTP запросов
└── auth.log      # Специальные логи событий авторизации
```

## Использование в коде

### Для логирования успехов

```typescript
import {
    logSigninSuccess,
    logTokenRefreshed,
    logLogout
} from '../utils/authLogger.js';

// При успешной авторизации
logSigninSuccess(user.telegramId, user.username || null, req);

// При обновлении токена
logTokenRefreshed(userId, req);

// При logout
logLogout(userId, req);
```

### Для логирования ошибок

```typescript
import {
    logSigninFailed,
    logRefreshFailed,
    logAuthDenied
} from '../utils/authLogger.js';

// При ошибке авторизации
logSigninFailed('Invalid initData signature', req);

// При ошибке обновления токена
logRefreshFailed('Invalid refresh token', req);

// При отказе в доступе (в middleware)
logAuthDenied('Missing token', req.path, req.method, req);
```

## События и уровни

| События                  | Уровень |
|--------------------------|---------|
| SIGNIN_SUCCESS           | INFO    |
| TOKEN_REFRESHED          | INFO    |
| LOGOUT                   | INFO    |
| SIGNIN_FAILED            | WARN    |
| REFRESH_FAILED           | WARN    |
| AUTH_DENIED              | WARN    |

## Мониторинг

Для мониторинга подозрительной активности обратите внимание на:

1. **Множество SIGNIN_FAILED с одного IP** — попытки брутфорса
2. **Множество AUTH_DENIED с одного IP** — несанкционированный доступ
3. **Ошибки валидации TELEGRAM_BOT_TOKEN** — проблемы конфигурации

Рекомендуется регулярно проверять файл `logs/auth.log` для обнаружения аномалий.

## Формат функций

```typescript
export function logSigninSuccess(
    telegramId: string,
    username: string | null,
    req?: Request,
): void

export function logSigninFailed(
    reason: string,
    req?: Request,
): void

export function logTokenRefreshed(
    userId: string,
    req?: Request,
): void

export function logRefreshFailed(
    reason: string,
    req?: Request,
): void

export function logLogout(
    userId: string,
    req?: Request,
): void

export function logAuthDenied(
    reason: string,
    path: string,
    method: string,
    req?: Request,
): void
```

## Интеграция с существующим логированием

- **app.log** — содержит общие логи HTTP-запросов (все методы, статусы, время ответа)
- **auth.log** — содержит специальные логи авторизации (события, статусы, причины ошибок)

Оба файла работают параллельно и не дублируют друг друга.
