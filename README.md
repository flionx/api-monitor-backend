# API Monitor Backend

Uptime and availability monitoring REST API, built with Node.js, TypeScript, Express, PostgreSQL, and Drizzle ORM. It provides JWT authentication via httpOnly cookies, CRUD for monitors and notification channels, a background worker that checks endpoints on a schedule, and alerts to Telegram and Discord on status changes.

## Features

- **Auth**: register / login / logout with a JWT stored in an `httpOnly` cookie, bcrypt password hashing, rate-limited login and registration.
- **Monitors**: full CRUD with interval, timeout and failure threshold; paginated list with search and status filters.
- **Heartbeat worker**: a background loop checks due monitors with bounded concurrency and stores every result (status code, response time, error type).
- **Alerting**: a monitor is confirmed `down` only after N consecutive failures (`failureThreshold`); alerts fire on confirmed transitions (`down` and recovery) and are sent through Telegram and Discord with customizable message templates.
- **Notification channels**: Telegram bot and Discord webhook channels stored as validated JSONB, secrets masked in API responses, test-message endpoint.
- **Metrics**: uptime percentage, response time (avg / min / max / p95), time-bucketed chart data and an account-level dashboard summary.
- **Check history**: cursor-paginated log of checks with an optional success/failure filter.
- **SSRF protection**: monitor URLs are validated on input, and the worker re-validates the resolved IP at connect time and on every redirect hop.

## Tech stack

Node.js 24, TypeScript, Express 5, PostgreSQL, Drizzle ORM, Zod 4, Undici, pnpm.

## Architecture

Feature-first layout, each module follows `routes → controller → service`:

```text
src/
├── db/            # pg pool, Drizzle schema, migration runner
├── modules/
│   ├── auth/
│   ├── monitors/        # CRUD + monitor ↔ channel links
│   ├── notifications/   # channels, providers (Telegram/Discord), templates
│   ├── metrics/         # stats, chart, summary, overview
│   └── checks/          # check history
├── worker/        # scheduler loop + single-check logic
└── shared/        # config, errors, middleware, helpers
```

How a check works:

1. Every 10s the worker selects active monitors whose interval has elapsed and checks them with a concurrency limit.
2. The result is written to `checks`, and the monitor's confirmed state (`status`, `consecutiveFailures`, last check fields) is updated in the same transaction.
3. If the confirmed status changed, alerts are dispatched to the monitor's enabled channels (delivery errors never affect checks).

## Getting started

### Prerequisites

- Node.js 24, pnpm (version pinned in `package.json` via `packageManager`)
- PostgreSQL.

### Installation

1. Clone the repository and install dependencies:

    ```bash
    git clone https://github.com/flionx/api-monitor-backend.git
    cd api-monitor-backend
    pnpm install
    ```

2. Configure environment variables:

    ```bash
    cp .env.example .env     # then edit DATABASE_URL and JWT_SECRET
    ```

    Set `ALLOW_PRIVATE_TARGETS=true` in `.env` if you want to monitor a local server during development.

3. Run database migrations & start development server:

    ```bash
    pnpm db:migrate
    pnpm dev
    ```

### Environment variables

| Variable                | Default                 | Description                                                                  |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| `NODE_ENV`              | `development`           | `development`, `production` or `test`                                        |
| `PORT`                  | `5000`                  | HTTP port                                                                    |
| `DATABASE_URL`          | none                    | PostgreSQL connection string                                                 |
| `JWT_SECRET`            | none                    | At least 32 characters                                                       |
| `CORS_ORIGINS`          | `http://localhost:3000` | Comma-separated allowed frontend origins                                     |
| `WORKER_ENABLED`        | `true`                  | Run the background worker                                                    |
| `ALLOW_PRIVATE_TARGETS` | `false`                 | Allow monitors to target private networks (dev only, rejected in production) |

### Scripts

| Script             | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Run with hot reload                               |
| `pnpm build`       | Compile TypeScript to `dist/`                     |
| `pnpm start`       | Run the compiled app from `dist/`                 |
| `pnpm db:generate` | Generate a SQL migration from `schema.ts` changes |
| `pnpm db:migrate`  | Apply migrations                                  |

## API

Authentication uses the `token` cookie set by `login` / `register`. Every route except `register`, `login`, `logout` and `/health` requires it.
List endpoints return `{ data, meta }`.

### Auth

| Method | Path                 | Description                        |
| ------ | -------------------- | ---------------------------------- |
| POST   | `/api/auth/register` | Create account and start a session |
| POST   | `/api/auth/login`    | Start a session                    |
| POST   | `/api/auth/logout`   | End the session                    |
| GET    | `/api/auth/me`       | Current user                       |

### Monitors

| Method | Path                         | Description                                                        |
| ------ | ---------------------------- | ------------------------------------------------------------------ |
| GET    | `/api/monitors`              | List (`limit`, `offset`, `q`, `status`, `isActive`)                |
| POST   | `/api/monitors`              | Create                                                             |
| GET    | `/api/monitors/summary`      | Account-level counters, 24h uptime, currently down monitors        |
| GET    | `/api/monitors/:id`          | Get one                                                            |
| PATCH  | `/api/monitors/:id`          | Update                                                             |
| DELETE | `/api/monitors/:id`          | Delete                                                             |
| GET    | `/api/monitors/:id/overview` | Monitor + stats + chart in one request (`range`, `points`)         |
| GET    | `/api/monitors/:id/stats`    | Uptime and response time stats (`range`: `1h`, `24h`, `7d`, `30d`) |
| GET    | `/api/monitors/:id/chart`    | Time-bucketed response time series (`range`, `points`)             |
| GET    | `/api/monitors/:id/checks`   | Check history, cursor-paginated (`limit`, `cursor`, `isUp`)        |

### Notification channels

| Method | Path                                    | Description                                             |
| ------ | --------------------------------------- | ------------------------------------------------------- |
| GET    | `/api/notification-channels`            | List (`limit`, `offset`)                                |
| POST   | `/api/notification-channels`            | Create (`type`: `telegram` or `discord`)                |
| PATCH  | `/api/notification-channels/:id`        | Rename and/or update config (merged with stored config) |
| DELETE | `/api/notification-channels/:id`        | Delete                                                  |
| POST   | `/api/notification-channels/:id/test`   | Send a test message                                     |
| GET    | `/api/monitors/:id/channels`            | Channels attached to a monitor                          |
| PUT    | `/api/monitors/:id/channels/:channelId` | Attach (or replace link settings)                       |
| PATCH  | `/api/monitors/:id/channels/:channelId` | Change message template / enabled flag                  |
| DELETE | `/api/monitors/:id/channels/:channelId` | Detach                                                  |

### Message templates

Each monitor ↔ channel link can have a custom message. Available placeholders:
`{{monitor.name}}`, `{{monitor.url}}`, `{{status}}`, `{{statusCode}}`, `{{error}}`, `{{responseTimeMs}}`, `{{checkedAt}}`, `{{failures}}`.
Without a custom message, sensible defaults are used.

## Security notes

- Session JWT lives in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production); state-changing requests from untrusted origins are rejected.
- Channel secrets (bot tokens, webhook URLs) are masked in all API responses.
- Outbound requests (checks and notifications) use timeouts, and monitor targets are protected against SSRF, including DNS rebinding and redirects.

## Deployment

Deployed on Render (web service) with Neon (PostgreSQL).

- Build command: `pnpm install --frozen-lockfile --prod=false && pnpm build`
- Start command: `pnpm db:migrate && node dist/index.js`
- Health check: `/health`
- Set the environment variables from the table above.

Run a **single instance**: the worker is in-process, so multiple instances would duplicate checks and alerts.

## Limitations and roadmap

- On free tiers the service sleeps after 15 minutes without traffic, so monitoring only runs while the instance is awake. Use an always-on instance for real 24/7 monitoring.
- Planned: incident history, periodic cleanup for old checks, refresh tokens, automated tests.

## License

This project is licensed under the [MIT License](./LICENSE).
