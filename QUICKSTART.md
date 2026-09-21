> Обновлено: запуск с PostgreSQL и исправленной сменой пользователя — [RUNNING.md](./RUNNING.md). Команды и ограничения в нём имеют приоритет над прежней инструкцией ниже.

# MAX Smart City — QUICKSTART

> **Хакатон «Умный город» (MAX Платформа)**  
> Мини-приложение для управления жилым комплексом + чат-бот MAX

---

## Системные требования

| Инструмент | Минимальная версия | Установка |
|---|---|---|
| Node.js | **20 LTS** или выше | https://nodejs.org |
| npm | **10** или выше | поставляется с Node |
| Git | любая | https://git-scm.com |
| Docker *(опционально)* | 24+ | https://docker.com |

Проверьте версии:

```bash
node -v   # Ожидается: v20.x.x или выше
npm -v    # Ожидается: 10.x.x или выше
```

---

## Быстрый старт (рекомендуемый — без Docker)

### 1. Клонировать репозиторий

```bash
git clone <URL_РЕПОЗИТОРИЯ>
cd hackathon-max-smartcity_gruz67
```

### 2. Настроить переменные окружения

```bash
cp .env.example .env
# Отредактируйте .env при необходимости (MAX_BOT_TOKEN и т.д.)
# Для локального запуска все значения по умолчанию подходят
```

### 3. Установить зависимости бэкенда

```bash
cd backend
npm install
cd ..
```

### 4. Установить зависимости фронтенда

```bash
cd frontend
npm install
cd ..
```

### 5. Запустить бэкенд (в отдельном терминале)

```bash
cd backend
npm run dev
```

Бэкенд запустится на **http://localhost:3001**  
Проверка: http://localhost:3001/api/health

### 6. Запустить фронтенд (в другом терминале)

```bash
cd frontend
npm run dev
```

Приложение откроется на **http://localhost:5173**

---

## Запуск через Docker Compose (альтернатива)

Требуется установленный Docker Desktop.

```bash
# В корне проекта:
docker compose up --build
```

| Сервис | URL |
|---|---|
| Frontend (React) | http://localhost:5173 |
| Backend (API) | http://localhost:3001 |

Остановить:
```bash
docker compose down
```

---

## Структура проекта

```
hackathon-max-smartcity_gruz67/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── server.ts      # Основной Express-сервер (все REST-эндпоинты)
│   │   └── data/
│   │       └── mockData.ts  # Мок-данные (жильцы, заявки, счета и т.д.)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/              # React 18 + TypeScript + Vite + Tailwind v4
│   ├── src/
│   │   ├── App.tsx           # Корневой компонент, глобальное состояние
│   │   ├── types.ts          # TypeScript-интерфейсы
│   │   ├── index.css         # Глобальные стили, дизайн-система
│   │   ├── components/       # UI-компоненты (Header, Navigation, Modals)
│   │   ├── features/         # Экраны приложения:
│   │   │   ├── Dashboard.tsx      # Главная страница
│   │   │   ├── TicketsView.tsx    # Заявки и аварии
│   │   │   ├── BillsView.tsx      # Счета ЖКУ и показания
│   │   │   ├── MeetingsView.tsx   # Собрания ОСС и голосование
│   │   │   ├── CommunityView.tsx  # Треды и новости совета МКД
│   │   │   ├── DirectoryView.tsx  # Справочник (сотрудники, участковый)
│   │   │   ├── MarketplaceView.tsx # Барахолка и услуги
│   │   │   └── ProfileView.tsx    # Профиль жильца, настройки
│   │   └── lib/
│   │       └── api.ts        # API-клиент для фронтенда
│   ├── package.json
│   └── vite.config.ts
│
├── compose.yaml           # Docker Compose для запуска обоих сервисов
├── .env.example           # Шаблон переменных окружения
├── .gitignore
├── requirements.txt       # Описание зависимостей (этот файл)
├── openapi.yaml           # Спецификация OpenAPI для бэкенда
└── QUICKSTART.md          # Эта инструкция
```

---

## API Эндпоинты (бэкенд)

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/health` | Статус сервиса |
| GET | `/api/complex` | Информация о ЖК |
| GET | `/api/profile` | Профиль текущего жильца |
| GET | `/api/outages` | Аварии и отключения |
| GET | `/api/tickets` | Список заявок |
| POST | `/api/tickets` | Создать заявку |
| POST | `/api/tickets/:id/vote` | Поддержать/опровергнуть заявку |
| GET | `/api/bills` | Счета ЖКУ |
| POST | `/api/bills/:id/pay` | Оплатить квитанцию |
| GET | `/api/meters` | Показания счётчиков |
| POST | `/api/meters` | Передать показания |
| GET | `/api/meetings` | Собрания ОСС |
| POST | `/api/meetings/:id/vote-slot` | Проголосовать за время |
| GET | `/api/meetings/:id/calendar.ics` | Скачать .ics для календаря |
| GET | `/api/threads` | Треды сообщества |
| POST | `/api/threads` | Создать тред |
| POST | `/api/threads/:id/comments` | Комментарий к треду |
| GET | `/api/directory` | Справочник сотрудников и участкового |
| GET | `/api/marketplace` | Барахолка (объявления) |
| POST | `/api/marketplace` | Создать объявление |
| PUT | `/api/marketplace/:id` | Редактировать своё объявление |
| DELETE | `/api/marketplace/:id` | Удалить своё объявление |
| POST | `/api/neighbors/message` | Написать анонимно соседу |
| POST | `/api/parking/passes` | Создать гостевой пропуск |
| POST | `/api/parking/report-car` | Пожаловаться на автомобиль |
| POST | `/api/bot/webhook` | Вебхук для MAX-бота |

---

## Мок-пользователи (для демонстрации)

Приложение поддерживает переключение между двумя пользователями через меню **Профиль → Сменить пользователя**:

| Роль | Имя | Квартира | Права |
|---|---|---|---|
| **Обычный жилец** | Ким Дмитрий Алексеевич | 47 | Заявки, барахолка, треды, голосование |
| **Администратор (Председатель)** | Светлова Марина Ивановна | 1 | Все права + публикация официальных новостей |

> При переключении пользователя данные в интерфейсе обновляются мгновенно. Это мок без реальной аутентификации — только для демонстрации.

---

## Часто задаваемые вопросы

**Q: Порт 3001 или 5173 занят — что делать?**  
Откройте `.env` и поменяйте `BACKEND_PORT` или `FRONTEND_PORT`.  
Для фронтенда также можно передать флаг: `npm run dev -- --port 5174`

**Q: Ошибки CORS при запросе к API?**  
Убедитесь, что бэкенд (`npm run dev` в папке `backend/`) запущен перед фронтендом. По умолчанию CORS разрешён для всех источников.

**Q: Ошибка `Cannot find module 'tsx'`?**  
Запустите `npm install` внутри папки `backend/`.

**Q: Нужен ли MAX_BOT_TOKEN для локального запуска?**  
Нет. Мини-приложение (веб-интерфейс) работает полностью локально без токена. Токен нужен только для реального чат-бота MAX.

---

## Технологический стек

| Слой | Технология |
|---|---|
| Frontend UI | React 18, TypeScript, Vite |
| CSS | Tailwind CSS v4 (плагин @tailwindcss/vite) |
| Иконки | Lucide React |
| Уведомления | Sonner (toast stack) |
| Backend | Node.js + Express + TypeScript |
| Runtime TS | tsx (no build step for dev) |
| Контейнеризация | Docker + Docker Compose |

---

*MAX Smart City | Хакатон «Умный город» | ЖК «Северное Сияние»*
