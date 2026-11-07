# PARMA RESELL

Backend для сервиса передачи права посещения отдельных домашних матчей владельцами сезонных абонементов баскетбольных клубов. Первый клуб — «ПАРМА».

> Проект находится в разработке. Реальная продажа билетов, оплата и передача прав прохода отключены до подключения официального билетного оператора и платёжной инфраструктуры.

## Технологии

Python 3.12 · Flask · SQLAlchemy · Alembic / Flask-Migrate · PostgreSQL 16 · Redis (production rate limiting) · Gunicorn · pytest.

## Локальный запуск

```bash
cp .env.example .env
docker compose up --build
```

Перед первым использованием API примените миграции:

```bash
docker compose exec web flask --app wsgi:app db upgrade
```

Если сервис в Compose называется иначе, замените `web` на имя соответствующего сервиса.

Проверка: `GET http://localhost:5000/api/health` — доступность приложения; `GET http://localhost:5000/api/ready` — подключение к БД; `GET http://localhost:5000/api/meta` — статус функций.

## Тесты

```bash
pip install -r requirements.txt
python -m pytest -q
```

Интеграционный тест PostgreSQL запускается при наличии переменной `TEST_POSTGRES_URL`; в GitHub Actions используется PostgreSQL 16.

## Структура

- `app/` — модели, авторизация и HTTP API.
- `migrations/` — версионированная схема базы данных.
- `tests/` — модульные и интеграционные тесты.
- `docs/` — архитектура, резервирование и эксплуатация.
- `scripts/bootstrap_db.py` — исключительно локальная и явно разрешённая инициализация тестовой схемы.

## Статус API

Реализованы базовая авторизация, публичный каталог, заявления о владении абонементом, черновики объявлений и часть административных операций. Бронирование, платежи, перепроверка билетов у оператора и передача прав прохода пока недоступны.

Документация по запуску: [docs/deployment-checklist.md](docs/deployment-checklist.md). Описание проектирования резервирования: [docs/reservation-design.md](docs/reservation-design.md).
