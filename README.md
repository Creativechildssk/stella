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
- Postgres (Neon in production, PGLite in local preview)
- Better Auth (Google, X, email/password)

## Mobile

The site is built mobile-first and installs as a PWA.

## Local

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` only if you are running against a real Postgres instance. Local preview uses embedded PGLite and does not need it.

## Deploy

Set these on the host (Vercel or similar):

- `DATABASE_URL` — Postgres connection string
- Auth credentials for Google / X (optional; email/password works without them)

`npm run build` applies migrations, then start the production server.

## License

MIT. See [LICENSE](LICENSE).
