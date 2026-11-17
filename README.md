# PARMA RESELL

Платформа официальной передачи права посещения отдельных домашних матчей владельцами сезонных абонементов.

## Стек
- Python 3.12, Flask, PostgreSQL 16
- Flask-SQLAlchemy, Flask-Migrate
- JWT (access token + refresh cookie)
- Docker Compose
- OpenAPI 3.1 / Swagger UI

## Запуск
1. Скопируйте `.env.example` в `.env`.
2. Запустите: `docker compose up --build`.
3. Инициализируйте миграции (один раз):
   ```bash
   docker compose exec web flask --app wsgi:app db init
   docker compose exec web flask --app wsgi:app db migrate -m "initial schema"
   docker compose exec web flask --app wsgi:app db upgrade
   ```
4. API: http://localhost:5000/api/v1
5. Health: http://localhost:5000/api/health
6. Swagger UI: http://localhost:5000/docs
7. OpenAPI: http://localhost:5000/openapi.yaml
8. Контракт API: `docs/API_SPECIFICATION.md`.
9. Аудит и production gaps: `docs/BACKEND_AUDIT.md`.
8. Создайте администратора: `docker compose exec web flask --app wsgi:app create-admin`.

## Авторизация
- Access token передаётся в заголовке `Authorization: Bearer <token>`.
- Refresh token устанавливается в HttpOnly cookie.
- Access token действует 15 минут, refresh token — 30 дней.
- Refresh endpoint требует CSRF header/cookie, как настроено Flask-JWT-Extended.
- В production необходимо включить HTTPS, задать уникальные SECRET_KEY/JWT_SECRET_KEY и JWT_COOKIE_SECURE=true.

## Первичная настройка администратора
После применения миграций выполните `docker compose exec web flask --app wsgi:app create-admin`. Команда интерактивно запросит email, имя, фамилию и пароль администратора. Администратор может добавлять клубы, арены, места, матчи и вручную регистрировать результат проверки абонемента через защищённые `/api/v1/admin/*` endpoints.

## Роли и подтверждение абонемента
Регистрация создаёт роль `buyer`. Возможность публикации предложений предоставляется только после проверки абонемента. Реальная проверка не подключена: записи со статусом `verified` должны появляться только после доверенной административной/операторской процедуры.

## Заказы и платежи
Создание заказа временно резервирует предложение на 10 минут. Тестовый endpoint оплаты включён только при `PAYMENT_TEST_MODE=true`. Он не принимает реальные деньги и не выдаёт действительный билет. Для production потребуются платёжный провайдер, серверное подтверждение платежа/webhook, возвраты и согласованная передача права у СЦЕНА24.

## Интеграция СЦЕНА24
До получения официальной документации оператора операции с билетами остаются тестовыми. База PARMA RESELL не является источником истины о праве прохода. Нельзя проводить реальные сделки без подтверждённой блокировки, отзыва и передачи права на конкретный матч.

## Тесты
`pytest`
