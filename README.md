# Бронирование билетов на мероприятие

Полнофункциональный MVP: пошаговое бронирование (участники → контакты → проверка → результат), расчёт цен и все правила на backend, атомарное бронирование с блокировкой строки события в PostgreSQL.

## Возможности
- 1–4 участника, имя и возраст, автоматический тип билета: полный 2 000 ₽ (14+), детский 1 000 ₽ (младше 14).
- Ребёнок младше 14 допускается только при наличии участника 18+ в том же заказе (17 лет — не взрослый).
- Один контактный email на заказ (нормализуется: trim + нижний регистр), возраст 0–120, имена обрезаются и не бывают пустыми.
- Редактирование данных до подтверждения, защита от двойной отправки, экраны загрузки/ошибки/успеха/«мест нет».
- API: `GET /api/v1/events`, `GET /api/v1/events/{id}`, `POST /api/v1/bookings` (201/404/409/422), `GET /api/v1/bookings/{id}`. Ошибки: `{"error": {"code", "message", "details"?}}`.
- Интерфейс полностью на русском, палитра: `#895aeb` (акцент: шапка, кнопки, вкладки), `#111013` (текст), `#fefeff` (фон страницы и карточки).

## Стек
Next.js 15 (App Router), React 19, TypeScript strict, Tailwind 3 — без лишних библиотек (форма простая, RHF/Zod не нужны). FastAPI, Pydantic v2, SQLAlchemy 2 async + asyncpg, Alembic, PostgreSQL 16, pytest + HTTPX. Версии зафиксированы (`requirements.txt`, `frontend/package-lock.json`).

## Запуск (нужен только Docker с Compose)
```bash
cp .env.example .env        # при желании поменяйте пароль
docker compose up --build
```
Миграции (`alembic upgrade head`) и идемпотентное сидирование демо-события выполняются автоматически при старте backend (`backend/entrypoint.sh`). Вручную:
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```
- Приложение: http://localhost:3000
- API: http://localhost:8000/api/v1/events
- Swagger: http://localhost:8000/docs

## Демонстрация
- **Успешная бронь:** добавьте участника (например, Анна, 30), укажите email, подтвердите — появится номер брони.
- **«Мест нет»:** оставьте одно место и закажите двоих:
  ```bash
  docker compose exec backend python -m app.seed --set-booked 19   # вместимость по умолчанию 20
  ```
  Закажите 2 участников — реальная транзакция вернёт 409, введённые данные сохранятся. Сброс: `--set-booked 0`. Команда доступна только из консоли контейнера, публичного endpoint для изменения вместимости нет. Другая вместимость: `DEMO_EVENT_CAPACITY` в `.env` (применяется при создании события, т. е. на чистой БД: `docker compose down -v`).

## Тесты backend
```bash
docker compose run --rm --entrypoint pytest backend -q
```
Тесты используют отдельную базу `tickets_test` (создаётся скриптом `db/init`; на уже существующем томе создайте её: `docker compose exec db createdb -U tickets tickets_test`). Конфигурация тестов отказывается работать с базой, имя которой не оканчивается на `_test`.

## Транзакция и конкурентность
`booking_service.create_booking`: валидация и расчёт цен → `async with session.begin()` → `SELECT … FOR UPDATE` строки события → проверка `capacity - booked_tickets >= N` → вставка брони и участников, `booked_tickets += N` → коммит. Любое исключение откатывает всё. Параллельные запросы выстраиваются в очередь на блокировке строки, источник истины — `events.booked_tickets` (+ CHECK `booked_tickets <= capacity` как страховка).

## Структура и где менять
```
backend/app/{api/routes, schemas, services, repositories, db/models, seed.py, exceptions.py}
backend/alembic, backend/tests
frontend/src/{app, components/booking, lib, types}
```
| Что изменить | Где |
|---|---|
| Цены, порог детского возраста, лимит участников, возраст взрослого | `backend/app/services/pricing.py` (константы) |
| Правило сопровождения | `pricing.has_required_adult` + сообщение в `booking_service.validate_participants` |
| Вместимость | `DEMO_EVENT_CAPACITY` в `.env` для нового события или `python -m app.seed --set-booked` для демо; в коде — `app/seed.py` |
| Новое поле заказа | схема `schemas/booking.py`, модель `db/models/booking.py` + миграция Alembic, `booking_service.py`, тип `frontend/src/types/api.ts`, форма в `components/booking/` |

Frontend получает цены и пороги из API (`pricing` в событии), поэтому дублируются только простые проверки для мгновенной обратной связи (`frontend/src/lib/validation.ts`).

## Результаты проверки (реально выполнено в среде разработки)
- Backend: `pytest` на реальном PostgreSQL 16 — **21 тест пройден** (цены, границы возраста 13/14, правило взрослого, валидация, поддельные цены, 409 без частичных записей, 8 параллельных заказов на 5 мест → ровно 5×201 и 3×409).
- Frontend: `tsc --noEmit` и `next build` — без ошибок; SSR-страница получает событие из живого API; CORS preflight проверен.
- Сценарий «мест нет» через `python -m app.seed --set-booked 19` и заказ двух участников → HTTP 409 от реальной транзакции.

## Ограничения
- **Docker в среде разработки отсутствовал**, поэтому `docker compose up` и Dockerfile **не запускались**; backend и frontend проверены напрямую с локальным PostgreSQL. Перед демонстрацией выполните `docker compose up --build`.
- Интерфейс прогнан в headless Chromium (десктоп 1280 px и мобильный 360 px): весь сценарий «участник → email → проверка → подтверждение» проходит, горизонтального переполнения нет. Это ручной прогон, автотестов фронтенда в проекте нет.
- Нет оплаты, аккаунтов, писем и временного резервирования мест (по условию).
