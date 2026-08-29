# Smart Parking Prizren

Platformë real-time për parkim inteligjent në Prizren — WebSocket + Redis pub/sub + PostGIS.

## Struktura

- `smart-parking-frontend/` — Next.js (App Router) + TypeScript + Tailwind/shadcn
- `smart-parking-backend/` — NestJS + Prisma + PostgreSQL/PostGIS + Redis
- `docker-compose.yml` — orkestrimi lokal i të katër shërbimeve
- `CLAUDE.md` — konteksti i plotë i projektit (stack, modeli i të dhënave, roadmap)

## Nisja lokale

1. Kopjo `.env.example` → `.env` në rrënjë, dhe `.env.example` → `.env` në secilin nënprojekt.
2. Nga rrënja:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### Zhvillim pa Docker (opsionale)

```bash
# Postgres+PostGIS dhe Redis vetëm në Docker
docker compose up postgres redis

# Backend
cd smart-parking-backend
npm install
npx prisma generate
npm run start:dev

# Frontend (terminal tjetër)
cd smart-parking-frontend
npm install
npm run dev
```

## Roadmap

Shih seksionin 6 të [`CLAUDE.md`](./CLAUDE.md) për fazat e projektit.
