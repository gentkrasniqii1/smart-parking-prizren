# 🅿️ Smart Parking Prizren

Real-time smart parking platform for the city of Prizren, Kosovo. Live spot availability on an interactive map, zone-based reservations, and an admin dashboard — built on a WebSocket + Redis pub/sub architecture instead of simple polling.

> Part of a civic-tech portfolio series for Prizren. See also: [Prizren Smart City](https://github.com/gentkrasniqii1/prizren-smart-city).

## Features

- 🔴 **Live occupancy map** — parking spot status updates in real time via WebSocket, no manual refresh
- 📍 **Zone & spot management** — PostGIS-backed geospatial data for accurate mapping
- 🅿️ **Reservations** — book a spot in advance with conflict validation
- 📱 **Citizen check-in** — QR-code / manual check-in as a live data source alongside simulated sensors
- 🛠️ **Admin dashboard** — manage zones, spots, and view occupancy analytics
- 🔐 **Role-based access** — citizen / attendant / admin, JWT auth with refresh tokens

## Tech Stack

**Frontend**
- Next.js 14 (App Router) · TypeScript
- TailwindCSS · shadcn/ui
- React Query · Zustand
- Socket.io-client · MapLibre GL

**Backend**
- NestJS · TypeScript
- WebSocket Gateway (Socket.io) · Redis pub/sub
- PostgreSQL + PostGIS · Prisma ORM
- JWT auth (access + refresh) · RBAC

**Infra**
- Docker Compose (local dev)
- Deploy: Vercel (frontend) · Railway/Render (backend, Postgres, Redis)

## Architecture

```
smart-parking-prizren/
├── smart-parking-frontend/   # Next.js app
├── smart-parking-backend/    # NestJS API + WebSocket Gateway
└── docker-compose.yml        # Postgres+PostGIS, Redis, backend, frontend
```

Real-time updates flow: sensor simulator / citizen check-in → Postgres write → Redis pub/sub → NestJS Gateway → WebSocket broadcast to clients in the relevant zone room → map updates live on the frontend.

## Getting Started

**Prerequisites:** Node.js 20+, Docker Desktop

```bash
git clone https://github.com/gentkrasniqii1/smart-parking-prizren.git
cd smart-parking-prizren

# Start Postgres + Redis
docker compose up -d

# Backend
cd smart-parking-backend
cp .env.example .env
npm install
npm run start:dev

# Frontend (new terminal)
cd smart-parking-frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`, backend API at `http://localhost:3001`.

## Roadmap

- [x] Faza 0 — Scaffold (Next.js + NestJS + Docker)
- [x] Faza 1 — Auth (JWT + RBAC)
- [x] Faza 2 — Zones & Spots CRUD + harta bazë
- [ ] Faza 3 — WebSocket real-time + sensor simulator
- [ ] Faza 4 — Check-in manual (QR)
- [ ] Faza 5 — Rezervimet
- [ ] Faza 6 — Admin dashboard
- [ ] Faza 7-13 — Njoftimet, audit logs, analitika, testim, deploy

## Live Demo

_Coming soon_

## License

MIT © Gent Krasniqi

## Author

**Gent Krasniqi** — Computer Science student, Prizren
[Portfolio](https://gent-portfolio.vercel.app/) · [GitHub](https://github.com/gentkrasniqii1)
