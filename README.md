# Cinema API: домашнє завдання 1

Серверна частина кінотеатру на NestJS

## Запуск


```bash
npm install

cp .env.example .env

npm run start:dev
```

Після запуску:

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs

### Приклад `.env`

```env
# Порт HTTP-сервера
PORT=3000
```

## Перевірка

Файл [`requests.http`](requests.http)

Автотести:

```bash
npm run test:e2e
```