# Stella

A photography community — inspiration feed, photograph of the day, missions, stars, and critique.

Browse as a guest. Sign in (Google, X, or email) to give stars, follow, save, upload, and comment. The first person to create an account becomes the sole superadmin.

**Live repo:** [github.com/Creativechildssk/stella](https://github.com/Creativechildssk/stella)

## Superadmin

There is one superadmin seat. That person can:

- Feature photographs and set Photograph of the Day
- Create, edit, and delete missions
- Remove photographs and critique notes
- See every member

## Stack

- TanStack Start + React 19
- Postgres (Neon in production, PGLite locally)
- Better Auth (Google, X, email/password)

## Local

```bash
npm install
npm run dev
```

Copy `.env.example` only if you are running against real Postgres. Local preview uses embedded PGLite.

## License

MIT. See [LICENSE](LICENSE).
