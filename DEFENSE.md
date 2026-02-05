# Защита Assignment 3 Part 2 — что показать и что сказать

Используй этот файл как шпаргалку на защите. **Postman не используй** — всё показывай через веб-интерфейс.

---

## 1. Открыть приложение (1 мин)

1. Открой в браузере: **https://web2-asik-3-2.onrender.com**
2. Скажи коротко:
   - *«Это продакшен-версия TaskManager, задеплоенная на Render. Корневой URL `/` — это главная страница с интерфейсом управления задачами.»*

---

## 2. Показать логин/сессии и полный CRUD через веб-интерфейс (4–5 мин)

Делай по порядку, без Postman.

### Логин / сессия
- Заполни форму логина: **admin@example.com / admin123** → Login.
- Скажи: *«После успешного логина сервер создаёт сессию, express-session пишет cookie `sid` (HttpOnly, Secure в продакшене). Пароли в cookie не хранятся.»*
- Покажи статус «Logged in as ...». Если выйдешь — POST /api/logout, сессия уничтожается.

### CREATE (создание)
- Заполни форму: Title (обязательно), Description, Status, Priority, Due Date, Category, Assignee, Tags.
- Нажми **Save Task**.
- Скажи: *«POST /api/tasks — создаёт задачу в MongoDB; операция доступна только после логина.»*
- Покажи, что задача появилась в таблице.

### READ (чтение)
- Скажи: *«GET /api/tasks грузит данные при открытии страницы, таблица показывает все поля.»*
- Покажи столбцы: Title, Description, Status, Priority, Due, Category, Assignee, Tags, Created.

### UPDATE (обновление)
- Нажми **Edit**, измени пару полей, **Save Task**.
- Скажи: *«PUT /api/tasks/:id — обновляет документ в MongoDB; доступ только авторизованным.»*

### DELETE (удаление)
- Нажми **Delete**, подтверди.
- Скажи: *«DELETE /api/tasks/:id — удаляет документ; доступ только авторизованным.»*

---

## 3. Объяснить backend и API (2 мин)

Можешь открыть `server.js` в редакторе и кратко пройтись:

- *«Бэкенд — Node.js и Express. Подключаем Mongoose к MongoDB через `process.env.MONGO_URI`. Сессии — express-session + connect-mongo, cookie HttpOnly (Secure в продакшене).»*
- *«Модель задачи `Task`: title, description, status, priority, dueDate, category, assignee, tags, timestamps.»*
- *«CRUD эндпоинты:*
  - *`GET /api/tasks` — список (доступен без логина);*
  - *`POST /api/tasks` — создание (только авторизованные);*
  - *`PUT /api/tasks/:id` — обновление (только авторизованные);*
  - *`DELETE /api/tasks/:id` — удаление (только авторизованные).»*
- *«Auth эндпоинты: `POST /login`, `POST /logout`, `GET /me`. Пароли хешируются bcrypt; при ошибке — «Invalid credentials» без подробностей.»*
- *«Корень `/` отдаёт `index.html`, `app.js` через fetch вызывает API.»*

---

## 4. Объяснить MongoDB (1–2 мин)

- *«База данных — MongoDB Atlas, подключение по `MONGO_URI`. Коллекция `tasks` создаётся Mongoose автоматически, есть коллекция `sessions` для хранения сессий.»*
- *«Данные задачи: title, description, status, priority, dueDate, category, assignee, tags, timestamps. Секретов в коде нет — все через env.»*

---

## 5. Объяснить переменные окружения и деплой (1–2 мин)

- *«Переменные: `PORT`, `MONGO_URI`, `SESSION_SECRET`. Локально они в `.env` (в .gitignore), на Render задаются в панели Environment.»*
- *«Порт в продакшене приходит от Render (`process.env.PORT`), Secure флаг на cookie включается, если `NODE_ENV=production`.»*
- *«Деплой: GitHub → Render (Build: npm install, Start: npm start). Публичный URL: https://web2-asik-3-2.onrender.com.»*

---

## 6. Разница local и production (если спросят)

- **Local:** `http://localhost:3000`, переменные из `.env`, MongoDB должен разрешать твой IP в Network Access.
- **Production:** публичный URL Render, переменные из панели Render, в Atlas для Render открыт доступ по IP (например, 0.0.0.0/0 для теста).

---

## 7. Возможные вопросы и короткие ответы

| Вопрос | Ответ |
|--------|--------|
| Где хранятся задачи? | В MongoDB Atlas, коллекция `tasks`, через Mongoose модель `Task`. |
| Как фронт общается с бэком? | Через `fetch()` в `public/app.js` — GET/POST/PUT/DELETE на `/api/tasks` и `/api/tasks/:id`. |
| Почему не Postman на защите? | По заданию все операции показываются через веб-интерфейс. |
| Что в .env? | `PORT`, `MONGO_URI`, `SESSION_SECRET`; локально, в репозиторий не коммитится. |
| Как запускается на Render? | Build: `npm install`, Start: `npm start` (т.е. `node server.js`), порт из `process.env.PORT`. |
| Как обеспечены сессии? | express-session + connect-mongo, cookie HttpOnly (Secure в прод). В cookie нет паролей. |
| Пароли как хранятся? | Только в виде bcrypt-хеша в БД; при логине проверяется compare. |

---

## Чек-лист перед защитой

- [ ] Открывается https://web2-asik-3-2.onrender.com
- [ ] В логах Render есть «MongoDB connected» (если нет — проверить MONGO_URI и IP в Atlas)
- [ ] Создание задачи через форму работает
- [ ] Редактирование (Edit → изменить → Save) работает
- [ ] Удаление (Delete → подтвердить) работает
- [ ] README.md содержит deployed URL и инструкции
- [ ] Не использовать Postman — только браузер

Удачи на защите.
