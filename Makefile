.PHONY: dev dev-frontend dev-backend dev-bot install

## Запуск всех сервисов параллельно
dev:
	@echo "🚀 Запускаем фронтенд, бэкенд и бота..."
	$(MAKE) -j3 dev-frontend dev-backend dev-bot

dev-frontend:
	cd my-app && npm run dev

dev-backend:
	cd backend-new && npm run dev

dev-bot:
	cd telegram-admin-bot && npm run dev

## Установка зависимостей во всех проектах
install:
	cd my-app && npm install
	cd backend-new && npm install
	cd telegram-admin-bot && npm install
