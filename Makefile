.PHONY: dev dev-frontend dev-backend dev-bot install deploy-frontend

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

## Сборка и деплой фронтенда на продакшн
deploy-frontend:
	cd my-app && npm run build
	cp -r my-app/dist/. /var/www/my-app/
	@echo "✅ Фронтенд задеплоен в /var/www/my-app/"

## Установка зависимостей во всех проектах
install:
	cd my-app && npm install
	cd backend-new && npm install
	cd telegram-admin-bot && npm install
