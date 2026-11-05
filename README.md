# PARMA RESELL

Платформа официальной передачи права посещения отдельных домашних матчей владельцами сезонных абонементов.

## Стек

- Python 3.12
- Flask
- PostgreSQL 16
- Flask-SQLAlchemy и Flask-Migrate
- Docker Compose

## Запуск через Docker

1. Создайте локальный файл окружения:

   ```bash
   cp .env.example .env
   ```

2. Запустите приложение и базу:

   ```bash
   docker compose up --build
   ```

3. Проверьте адреса:

   - http://localhost:5000/
   - http://localhost:5000/api/health

Остановка: `docker compose down`. Данные PostgreSQL сохраняются в Docker volume. Для полного удаления локальной БД используйте `docker compose down -v` (это удалит данные).

## Локальный запуск без Docker

Нужен Python 3.12 и установленный PostgreSQL.

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Скопируйте `.env.example` в `.env`, укажите параметры локальной БД и выполните:

```bash
flask --app wsgi:app run --debug
```

## Принцип интеграции с билетным оператором

До подтверждения API СЦЕНА24 все операции с билетами остаются тестовыми. База PARMA RESELL не является источником истины о праве прохода. Нельзя проводить реальные сделки, пока оператор не подтвердит безопасную блокировку, отзыв и передачу права на конкретный матч.

## Текущий статус

Начальный каркас Flask backend. Следующий этап — проверка запуска, миграции и первые доменные модели.
