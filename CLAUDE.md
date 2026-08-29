# CLAUDE.md — Smart Parking Prizren

Ky skedar lexohet automatikisht nga Claude Code në çdo sesion. Mbaje të përditësuar pas çdo vendimi të madh arkitekturor.

## 1. Konteksti i projektit
Platformë real-time për parkim inteligjent në Prizren — projekti #2 i portofolit (Frontend/Full-Stack Developer), pas "Prizren Smart City". Tregon në kohë reale vendparkimet e lira/zëna në hartë, lejon rezervim, dhe i jep administratorëve panel analitik.

**Diferencuesi kryesor**: arkitekturë real-time e vërtetë (WebSocket + Redis pub/sub), jo polling.

## 2. Tech Stack (i vendosur)

**Frontend** (`smart-parking-frontend/`):
- Next.js (App Router), TypeScript, TailwindCSS + shadcn/ui
- React Query (server state) + Zustand (client/UI state)
- socket.io-client, MapLibre GL (+ react-map-gl) për hartën

**Backend** (`smart-parking-backend/`):
- NestJS + TypeScript (ESM, `type: module`)
- WebSocket Gateway (Socket.io adapter i integruar)
- PostgreSQL + PostGIS
- Prisma ORM — **i fiksuar në `^6.19.3`**. Arsye: `prisma`/`@prisma/client` v7+ e zhvendos CLI-n drejt "Prisma Developer Platform" (cloud-first: `deploy`, `contract`, `postgres` si shërbim menaxhuar), duke hequr workflow-in klasik lokal (`prisma init` s'krijon më `schema.prisma`, `migrate`/`generate` fshihen pas `orm`). Ne përdorim Postgres+PostGIS self-hosted në Docker, jo Prisma Postgres cloud, prandaj v6 (linja klasike ORM) është zgjedhja e saktë deri sa arkitektura jonë të kërkojë platformën cloud.
- Redis — pub/sub + caching (`ioredis`, `@socket.io/redis-adapter`)
- JWT auth (access + refresh) + RBAC (citizen / attendant / admin) — `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
- class-validator / class-transformer për validim inputesh
- BullMQ (opsionale, fazë e mëvonshme) për job queue

**Infra & DevOps:**
- Docker Compose lokal (postgres+postgis, redis, backend, frontend) — shih `docker-compose.yml`
- Deploy (fazë e mëvonshme): frontend → Vercel; backend+redis+postgres → Railway/Render

## 3. Modeli i të dhënave (draft — shtohet fazë pas faze te `smart-parking-backend/prisma/schema.prisma`)
- **User** (id, email, passwordHash, role: citizen | attendant | admin, hashedRefreshToken, createdAt, updatedAt) — ✅ Faza 1
- **ParkingZone** (emri, poligoni gjeografik — PostGIS) — Faza 2
- **ParkingSpot** (kodi, koordinata — PostGIS point, zonaId, statusi: free | occupied | reserved | disabled) — Faza 2
- **ParkingSession** (spotId, userId?, checkIn, checkOut, burimi: sensor | manual | qr) — Faza 3–4
- **Reservation** (spotId, userId, koha_fillimit, koha_mbarimit, statusi) — Faza 5
- **SensorEvent** (spotId, statusi, timestamp) — Faza 3
- **Notification** (userId, tipi, mesazhi, lexuar) — Faza 7
- **AuditLog** (aksioni, aktori, timestamp) — Faza 8

## 4. Arkitektura real-time
- "Sensor simulator" (worker/cron në backend, `modules/sensor-simulator/`) ndryshon rastësisht statusin e vendparkimeve çdo N sekonda — simulon sensorë IoT.
- Check-in/check-out manual nga qytetarët (QR ose buton "Parkova këtu") — burim i dytë i vërtetë i të dhënave.
- Çdo ndryshim statusi → Redis pub/sub channel → NestJS Gateway (`modules/realtime/`) → WebSocket te klientët në "room"-in e zonës.
- Frontend: harta përditësohet live pa refresh (animacion i vogël në ndryshim statusi).
- Redis pub/sub (jo broadcast in-memory) përgatit shkallëzimin horizontal.

## 5. Struktura e folderave (aktuale)

```
smart-parking-prizren/
├── smart-parking-frontend/
│   ├── app/
│   │   ├── (public)/page.tsx, (public)/zones/[id]/page.tsx
│   │   ├── (auth)/login/, (auth)/register/
│   │   ├── (dashboard)/admin/, (dashboard)/attendant/
│   │   └── layout.tsx
│   ├── components/{map,realtime,ui,providers}/
│   ├── hooks/useParkingSocket.ts
│   ├── lib/{api.ts,socket.ts,utils.ts,validators/}
│   ├── store/useUiStore.ts
│   └── Dockerfile, .env.example
│
├── smart-parking-backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/ ✅ (controller, service, dto, strategies, types)
│   │   │   ├── users/ ✅ (service, mapper)
│   │   │   └── {zones,spots,sessions,reservations,realtime,sensor-simulator,notifications,audit-log}/ (bosh, fazë e mëvonshme)
│   │   ├── common/{guards,decorators}/ ✅ (JwtAuthGuard, JwtRefreshGuard, RolesGuard, @Roles(), @CurrentUser())
│   │   ├── common/{filters,pipes}/ (bosh)
│   │   ├── config/
│   │   ├── prisma/{prisma.module.ts,prisma.service.ts}
│   │   ├── app.module.ts, main.ts (ValidationPipe global + CORS)
│   │   └── prisma/schema.prisma (User + enum Role; modelet e tjera shtohen fazë pas faze)
│   └── Dockerfile
│
├── docker-compose.yml
├── CLAUDE.md
└── README.md
```

## 6. Roadmap me faza (kërko aprovim para se të kalosh në fazën tjetër)
- [x] **Faza 0:** Konfirmim arkitekture + scaffold i dy projekteve + Docker Compose + CLAUDE.md
- [x] **Faza 1:** Auth (JWT + refresh + RBAC) + modeli i User
- [ ] **Faza 2:** Zones & Spots CRUD + PostGIS + harta bazë (statike)
- [ ] **Faza 3:** WebSocket Gateway + Redis pub/sub + sensor simulator → harta bëhet live
- [ ] **Faza 4:** Check-in/check-out manual (QR/buton)
- [ ] **Faza 5:** Rezervimet (booking) + validim konfliktesh kohore
- [ ] **Faza 6:** Admin dashboard
- [ ] **Faza 7:** Njoftimet
- [ ] **Faza 8:** Audit logs + rate-limiting/anti-abuse
- [ ] **Faza 9:** Analitika e avancuar (heatmap PostGIS)
- [ ] **Faza 10:** Polish UI/UX
- [ ] **Faza 11:** Testim (unit + e2e)
- [ ] **Faza 12:** Dockerizim final + deploy
- [ ] **Faza 13:** Dokumentim

## 7. Rregulla pune
- Para se të shkruash kod për një fazë, propozo shkurt planin dhe prit aprovimin.
- Mos e "hollosh" arkitekturën real-time drejt polling-ut për lehtësi — nëse ka pengesë teknike, thuaje hapur dhe propozo alternativë.
- TypeScript strikt (pa `any` pa arsye), Zod/class-validator për çdo input.
- Kod production-grade — trajto rastet kufitare (spot i zënë, WebSocket i shkëputur, konflikt rezervimi, etj.)
- Mbaje `CLAUDE.md` të përditësuar pas çdo vendimi të madh arkitekturor.
- Gent bën `git add/commit/push` vetë — vetëm sugjero mesazhet e commit-it dhe komanda git read-only.
- `.env.example` gjithmonë; kurrë sekrete reale në kod.

## 8. Vendime arkitekturore (log)
- **2026-08-29** — Prisma i fiksuar në `^6.x` (jo latest/v7+). Shih arsyetimin te seksioni 2.
- **2026-08-29** — Backend i skaffoldur me Nest CLI më të fundit → vjen me `vitest` (jo jest) dhe `oxlint` (jo eslint) si default; mbajtur si janë, s'ka arsye teknike për t'i ndryshuar.
- **2026-08-29** — Harta: zgjedhur **MapLibre GL + react-map-gl** (jo Leaflet) — vektor-based, performancë më e mirë për shumë markera live-update.
- **2026-08-29** — Porti i host-it për Postgres në `docker-compose.yml` ndryshuar në `5433` (nga default 5432), konfigurueshëm via `POSTGRES_PORT`. Arsye: konteneri `prizren-postgres` i projektit "Prizren Smart City" e zë 5432 në këtë makinë; brenda rrjetit të docker-it backend-i vazhdon të lidhet te `postgres:5432` (pa ndryshim).
- **2026-08-29** — Faza 1 (Auth): `User` model + enum `Role` në Prisma; migrimi `20260829013937_add_user_model` u aplikua (me konfirmim eksplicit të Gent-it, pasi Prisma vetë e bllokoi `migrate reset` si veprim të rrezikshëm nga një agjent AI). `AuthModule` përdor `PassportModule.register({ defaultStrategy: 'jwt' })` (jo `PassportModule` bosh) — pa `.register()`, `AuthModuleOptions` s'ofrohet fare si provider dhe `JwtRefreshGuard`/`JwtAuthGuard` dështojnë në DI edhe pse parametri është `@Optional()`. Refresh token ruhet i hash-uar (bcrypt) te `User.hashedRefreshToken`, rrotullohet në çdo `/auth/refresh`, dhe pastrohet në `/auth/logout` (revokim i menjëhershëm). Testuar end-to-end me curl: register/login/me/refresh/logout/revocation — të gjitha OK.
