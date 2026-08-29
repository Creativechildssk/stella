# Stella

A photography community — inspiration feed, photograph of the day, missions, stars, and critique.

Browse as a guest. Sign in (Google, X, or email) to give stars, follow, save, upload, and comment. The first person to create an account becomes the sole superadmin.

**Repo:** [github.com/Creativechildssk/stella](https://github.com/Creativechildssk/stella)

## Superadmin

There is one superadmin seat. That person can:

- Feature photographs and set Photograph of the Day
- Create, edit, and delete missions
- Remove photographs and critique notes
- See every member

## Stack

- TanStack Start + React 19
- Postgres (Neon in production, Docker Compose, or PGLite in local preview)
- Better Auth (Google, X, email/password)

## Mobile

The site is built mobile-first and installs as a PWA.

## Docker

Production image plus Postgres. One command:

```bash
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000). The first account created is superadmin.

Copy `.env.example` to `.env` to override:

| Variable | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | Session signing key (`openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | Public origin, e.g. `https://stella.example.com` |
| `POSTGRES_PASSWORD` | Postgres password (default `stella`) |
| `STELLA_PORT` | Host port (default `3000`) |

Email/password works with no extra setup. Google / X need their client id and secret in `.env`.

Put TLS in front of the container for a public host (`__Host-` session cookies require HTTPS off localhost).

Stop and keep the database:

```bash
docker compose down
```

Wipe photos, members, and the database volume:

```bash
docker compose down -v
```

## Local (without Docker)

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` only if you are running against a real Postgres instance. Local preview uses embedded PGLite and does not need it.

To build the same Node server the image uses:

```bash
npm run build:node
npm start
```

## Deploy (Vercel)

Set these on the host:

- `DATABASE_URL` — Postgres connection string
- `BETTER_AUTH_SECRET` — long random string
- `BETTER_AUTH_URL` — public origin
- Auth credentials for Google / X (optional; email/password works without them)

`npm run build` applies migrations (Vercel serverless preset), then start the production server.

## License

MIT. See [LICENSE](LICENSE).
