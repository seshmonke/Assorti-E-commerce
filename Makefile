.PHONY: dev dev-frontend dev-backend dev-bot install deploy-frontend

## Запуск всех сервисов параллельно
dev:
	@echo "🚀 Запускаем фронтенд, бэкенд и бота..."
	$(MAKE) -j3 dev-frontend dev-backend dev-bot

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && npm run dev

dev-bot:
	cd telegram-admin-bot && npm run dev

## Сборка и деплой фронтенда на продакшн
deploy-frontend:
	cd frontend && npm run build
	cp -r frontend/dist/. /var/www/frontend/
	@echo "✅ Фронтенд задеплоен в /var/www/frontend/"

## Установка зависимостей во всех проектах
install:
	cd frontend && npm install
	cd backend && npm install
	cd telegram-admin-bot && npm install
