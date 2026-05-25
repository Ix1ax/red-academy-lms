<p align="center">
  <img src="docs/logo.svg" alt="РЕД Академия" width="96" />
</p>

<h1 align="center">РЕД Академия</h1>

<p align="center">
  <a href="https://редакадемия.рф">
    <img src="https://img.shields.io/badge/редакадемия.рф-E8192C?style=flat-square&logo=data:image/svg%2Bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHJ4PSI0NCIgcnk9IjQ0IiBmaWxsPSIjRTgxOTJDIi8+CiAgPHRleHQKICAgIHg9IjEwMCIKICAgIHk9IjE0OCIKICAgIGZvbnQtZmFtaWx5PSInQXJpYWwgQmxhY2snLCAnSGVsdmV0aWNhIE5ldWUnLCBBcmlhbCwgc2Fucy1zZXJpZiIKICAgIGZvbnQtc2l6ZT0iMTMwIgogICAgZm9udC13ZWlnaHQ9IjkwMCIKICAgIGZpbGw9IndoaXRlIgogICAgdGV4dC1hbmNob3I9Im1pZGRsZSIKICAgIGRvbWluYW50LWJhc2VsaW5lPSJhdXRvIgogICAgbGV0dGVyLXNwYWNpbmc9Ii00IgogID5QPC90ZXh0Pgo8L3N2Zz4K&logoColor=white" alt="редакадемия.рф" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.3.5-6DB33F?style=flat-square&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" />
</p>

<p align="center">
  Корпоративная платформа для управления обучением — курсы, интенсивы, сертификаты и аналитика в одном месте.
</p>

---

## Что внутри?

Микросервисная архитектура на Java + Spring Boot, SPA на React/TypeScript, всё поднимается одной командой через Docker Compose.

<p align="center">
  <img src="docs/architecture.svg" alt="Architecture" width="100%" />
</p>

| Сервис | Назначение |
|---|---|
| `identity-service` | Регистрация, авторизация, JWT, управление пользователями |
| `organization-service` | Организации, партнёрские заявки, сотрудники, инвайты |
| `learning-service` | Курсы, уроки, тесты, интенсивы, задания, сертификаты |
| `communication-service` | Уведомления (WebSocket + RabbitMQ), аудит |
| `gateway` | Единая точка входа, CORS, проксирование |
| `frontend` | React SPA (Vite + TypeScript + Tailwind) |

---

## Быстрый старт

### Требования

- Docker 24+ и Docker Compose v2
- Порты `5173` и `8080` должны быть свободны

### Локальная разработка

```bash
git clone <repo-url>
cd lms-platform

cp .env.example .env
# При необходимости поменяй пароли и JWT-секреты

docker compose up --build -d \
  postgres redis rabbitmq minio \
  identity-service organization-service learning-service communication-service \
  gateway frontend
```

После сборки (~3–5 минут в первый раз):

| Что | URL |
|---|---|
| Платформа | `http://localhost:5173` |
| API Gateway | `http://localhost:8080` |
| RabbitMQ UI | `http://localhost:15672` |
| MinIO Console | `http://localhost:9001` |

> Caddy для локалки не нужен — он только для прода с доменом и HTTPS.

### Прод (с доменом и TLS)

Раскомментируй в `.env` блок Caddy, укажи домен и email, затем:

```bash
docker compose up --build -d
```

Caddy сам получит сертификат Let's Encrypt и поднимет HTTPS.

### Остановка

```bash
docker compose down        # остановить
docker compose down -v     # остановить + сбросить все данные
```

---

## Переменные окружения

Все настройки — в файле `.env` (создаётся из `.env.example`).

**Обязательно сменить перед деплоем:**

| Переменная | Описание |
|---|---|
| `JWT_ACCESS_SECRET` | Секрет для подписи access-токенов |
| `JWT_REFRESH_SECRET` | Секрет для подписи refresh-токенов |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL |
| `RABBITMQ_PASSWORD` | Пароль RabbitMQ |
| `MINIO_ROOT_PASSWORD` | Пароль MinIO |

---

## Роли пользователей

| Роль | Описание |
|---|---|
| `ADMIN` | Полный доступ: модерация, управление организациями и пользователями |
| `PARTNER_MANAGER` | Управление компанией-партнёром, доступ к корпоративным курсам |
| `MENTOR` | Проверка заданий, выставление оценок в интенсивах |
| `STUDENT` | Прохождение публичных курсов |
| `CORPORATE_STUDENT` | Прохождение курсов своей организации |

---

## Стек

**Backend** — Java 17, Spring Boot 3.3.5, Spring Security (JWT), JdbcTemplate (без ORM), Maven multi-module

**Frontend** — React 18, TypeScript, Vite, Tailwind CSS, framer-motion, lucide-react

**Хранилище** — PostgreSQL 16 (4 схемы), Redis 7, MinIO (S3)

**Очередь** — RabbitMQ 3.13, async-события между сервисами + WebSocket для уведомлений

**Инфраструктура** — Docker Compose, Caddy 2 (прод, автоматический TLS)

---

## Схема базы данных

Одна база PostgreSQL, разбитая на 4 схемы:

```
identity      → users, sessions, refresh_tokens
organization  → organizations, members, invites, partner_requests
learning      → courses, modules, lessons, enrollments,
                intensives, tasks, task_submissions, certificates
communication → notifications, audit_log
```

Миграции применяются автоматически при первом старте PostgreSQL из нумерованных SQL-файлов в корне `migrations/`.

---
