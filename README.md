# red-academy-lms

## Deploy через Docker и Caddy

Проект подготовлен для запуска за Caddy reverse proxy. Caddy принимает внешний HTTP/HTTPS-трафик, автоматически получает TLS-сертификат Let's Encrypt и прокидывает запросы:

- `/api/*` и `/ws/*` в `gateway`;
- остальные запросы во `frontend`.

Домен `редакадемия.рф` в конфигурации используется в Punycode:

```text
xn--80aakcbevmv6a5n.xn--p1ai
```

### 1. DNS в REG.RU

В DNS-зоне домена добавьте A-записи на публичный IP сервера:

```text
@      A      SERVER_IP
www    A      SERVER_IP
```

Проверьте, что у домена используются DNS-серверы REG.RU: `ns1.reg.ru` и `ns2.reg.ru`.

### 2. Переменные окружения

На сервере создайте `.env` из примера:

```bash
cp .env.example .env
```

Минимально поменяйте:

```text
APP_DOMAIN=xn--80aakcbevmv6a5n.xn--p1ai
ACME_EMAIL=your-email@example.com
POSTGRES_PASSWORD=strong-password
RABBITMQ_PASSWORD=strong-password
MINIO_ROOT_PASSWORD=strong-password
JWT_ACCESS_SECRET=long-random-secret
JWT_REFRESH_SECRET=long-random-secret
FRONTEND_URL=https://xn--80aakcbevmv6a5n.xn--p1ai
```

`VITE_API_URL` для деплоя оставьте пустым. Тогда frontend будет обращаться к API по тому же домену.

### 3. Запуск

```bash
docker compose up -d --build
```

После запуска приложение должно открываться по:

```text
https://редакадемия.рф
https://www.редакадемия.рф
```

### 4. Важные порты

Публично должны быть открыты только:

```text
80/tcp
443/tcp
```

Остальные порты сервисов привязаны к `127.0.0.1`, чтобы PostgreSQL, Redis, RabbitMQ, MinIO и backend-сервисы не торчали наружу.
