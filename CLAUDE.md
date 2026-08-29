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
- **ParkingZone** (id, emri, `polygon` PostGIS `geometry(Polygon,4326)`, createdAt, updatedAt) — ✅ Faza 2
- **ParkingSpot** (id, kodi, `location` PostGIS `geometry(Point,4326)`, statusi: free|occupied|reserved|disabled, zoneId, unik (zoneId,code)) — ✅ Faza 2
- **ParkingSession** (spotId, userId?, checkIn, checkOut, burimi: sensor | manual | qr) — Faza 4
- **Reservation** (spotId, userId, koha_fillimit, koha_mbarimit, statusi) — Faza 5
- **SensorEvent** (id, spotId, statusi, timestamp) — ✅ Faza 3
- **Notification** (userId, tipi, mesazhi, lexuar) — Faza 7
- **AuditLog** (aksioni, aktori, timestamp) — Faza 8

## 4. Arkitektura real-time — ✅ Faza 3
- "Sensor simulator" (`modules/sensor-simulator/`, `@nestjs/schedule` `@Interval`) ndryshon rastësisht statusin e 1-2 vendparkimeve çdo `SENSOR_SIMULATOR_INTERVAL_MS` (default 8s, `SENSOR_SIMULATOR_ENABLED` për ta çaktivizuar) — simulon sensorë IoT, vetëm free↔occupied (reserved/disabled janë gjendje biznesi, jo sensori).
- Check-in/check-out manual nga qytetarët (QR ose buton "Parkova këtu") — burim i dytë i vërtetë i të dhënave — Faza 4.
- Çdo ndryshim statusi → shkruhet në DB + `SensorEvent` → publikohet në Redis pub/sub channel (`parking:spot-status`, `modules/redis/`) → NestJS Gateway (`modules/realtime/realtime.gateway.ts`) e merr si subscriber → WebSocket `spot:update` te klientët në "room"-in e zonës (Socket.io room = zoneId).
- Frontend: `useParkingSocket(zoneIds)` bashkohet me room-at, dhe në `spot:update` **patch-on direkt cache-in e React Query** (`setQueryData`, pa refetch) — real-time i vërtetë. `ParkingMap` bën "flash" të vogël (rreze+stroke më i madh, 1.2s) me `maplibre.setFeatureState` kur statusi i një spoti ndryshon.
- Redis pub/sub (jo broadcast in-memory) përgatit shkallëzimin horizontal: çdo instancë backend pajtohet te i njëjti channel dhe transmeton vetëm te socket-et e veta lokale në room-in përkatës — nuk kërkohet `@socket.io/redis-adapter` shtesë për korrektësi cross-instance me këtë design (paketa mbetet e instaluar për nevoja të mundshme më vonë).

## 5. Struktura e folderave (aktuale)

```
smart-parking-prizren/
├── smart-parking-frontend/
│   ├── app/
│   │   ├── (public)/page.tsx ✅ (harta statike), (public)/zones/[id]/ ✅ (detaje+listë spotesh)
│   │   ├── (auth)/login/, (auth)/register/
│   │   ├── (dashboard)/admin/, (dashboard)/attendant/
│   │   └── layout.tsx
│   ├── components/{map/ParkingMap.tsx ✅ (me flash live),ui,providers}/
│   ├── hooks/{useZones.ts,useSpots.ts,useParkingSocket.ts ✅ (patch cache live)}
│   ├── lib/{api.ts,zones.ts,spots.ts,types.ts ✅,socket.ts,utils.ts,validators/}
│   ├── store/useUiStore.ts
│   └── Dockerfile, .env.local, .env.example
│
├── smart-parking-backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/ ✅ (controller, service, dto, strategies, types)
│   │   │   ├── users/ ✅ (service, mapper)
│   │   │   ├── zones/ ✅ (CRUD raw-SQL + PostGIS, admin-only shkrim)
│   │   │   ├── spots/ ✅ (CRUD raw-SQL + PostGIS, admin-only shkrim; exports SpotsService)
│   │   │   ├── realtime/realtime.gateway.ts ✅ (Socket.io Gateway: zone:join/leave, spot:update)
│   │   │   ├── sensor-simulator/ ✅ (`@Interval` worker, free↔occupied)
│   │   │   └── {sessions,reservations,notifications,audit-log}/ (bosh, fazë e mëvonshme)
│   │   ├── redis/{redis.module.ts,redis.service.ts,redis-channels.ts} ✅ (@Global, publisher+subscriber ioredis)
│   │   ├── common/{guards,decorators}/ ✅ (JwtAuthGuard, JwtRefreshGuard, RolesGuard, @Roles(), @CurrentUser())
│   │   ├── common/{dto,validators}/ ✅ (GeoPointDto, GeoPolygonDto + validatorë GeoJSON)
│   │   ├── common/passport-global.module.ts ✅ (PassportModule global, shih §8)
│   │   ├── common/{filters,pipes}/ (bosh)
│   │   ├── config/
│   │   ├── prisma/{prisma.module.ts,prisma.service.ts}
│   │   ├── app.module.ts (+ScheduleModule.forRoot()), main.ts (ValidationPipe global + CORS)
│   │   └── prisma/{schema.prisma, seed.js} (User+Role, ParkingZone, ParkingSpot+SpotStatus, SensorEvent; `npm run db:seed`)
│   └── Dockerfile
│
├── docker-compose.yml
├── CLAUDE.md
├── .claude/launch.json  (preview_start: "frontend", npm --prefix smart-parking-frontend run dev)
└── README.md
```

## 6. Roadmap me faza (kërko aprovim para se të kalosh në fazën tjetër)
- [x] **Faza 0:** Konfirmim arkitekture + scaffold i dy projekteve + Docker Compose + CLAUDE.md
- [x] **Faza 1:** Auth (JWT + refresh + RBAC) + modeli i User
- [x] **Faza 2:** Zones & Spots CRUD + PostGIS + harta bazë (statike)
- [x] **Faza 3:** WebSocket Gateway + Redis pub/sub + sensor simulator → harta bëhet live
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
- **2026-08-29** — Faza 2 (Zones & Spots): `polygon`/`location` në Prisma janë `Unsupported("geometry(...)")` (Prisma s'i hidraton dot tipet PostGIS) → CRUD-i bëhet me `$queryRaw`/`$executeRaw` (`ST_GeomFromGeoJSON`/`ST_AsGeoJSON`), parametrizuar (pa injektim SQL). Shtuar indekse GiST (`parking_zones_polygon_gist_idx`, `parking_spots_location_gist_idx`) për kërkime gjeografike të shpejta (migrim i veçantë `add_spatial_indexes`, jo i gjeneruar nga Prisma). `JwtAuthGuard`/`RolesGuard` përdorur via `@UseGuards()` në module TË TJERA nga AuthModule (zones, spots) shkaktonin të njëjtin gabim DI si më sipër, sepse Nest i instancion guard-et me injector-in e modulit pritës — jo AuthModule. Zgjidhur duke krijuar `PassportGlobalModule` (`@Global()`, mbështjell `PassportModule.register({defaultStrategy:'jwt'})`) të importuar një herë në `AppModule`; kjo e bën `AuthModuleOptions` të disponueshëm kudo. Validim GeoJSON me validatorë të personalizuar class-validator (`common/validators/geojson.validator.ts`) — jo libreri e jashtme, mjaftonte për Point/Polygon. Krijuar `prisma/seed.js` (JS i thjeshtë, jo TS — CLI-ja e re e Prisma-s s'ka `ts-node` të integruar dhe seed-i s'ka nevojë për dekoratorë Nest) me 2 zona + 9 spote demo në Prizren + user admin (`admin@smartparking.rks` / `AdminPrizren2026!`, vetëm dev). **Harta**: `demotiles.maplibre.org` (stili fillestar) nuk arrinte kurrë event-in `load` në browser-in e sandbox-uar të testimit (edhe me stil krejt bosh pa burime, WebGL context krijohej por `readPixels` tregonte canvas plotësisht bosh — kufizim i mjedisit të testimit, jo bug në kod, i verifikuar duke inspektuar drejtpërdrejt gjendjen e brendshme të maplibre-gl: `style._loaded=true`, source-t me GeoJSON korrekt, layers në rend të saktë). Zgjidhje: stil bazë inline bosh (`BLANK_STYLE`, pa asnjë kërkesë rrjeti) + `fitBounds` mbi bbox-in real të zonave/spoteve në vend të një qendre/zoom fiks. Rekomandohet të verifikohet vizualisht në browser real të Gent-it; nëse dëshirohet basemap i vërtetë (OSM/MapTiler), shtohet si "polish" (Faza 10). Testuar CRUD+RBAC+validim+cascade-delete plotësisht me curl (200/201/400/401/403/404/409 siç pritej).
- **Shënim mjedisi**: `npm run start:dev` (Nest `--watch`) nën Windows shpesh e le procesin `node` të varur pas `TaskStop`/Ctrl-C — porti (3001) mbetet i zënë. Kontrollo `Get-NetTCPConnection -LocalPort 3001` dhe bëj `Stop-Process` para se të rinisësh serverin.
- **2026-08-29** — Faza 3 (Real-time): `RedisService` mban 2 lidhje `ioredis` (`publisher`/`subscriber`) — një klient në modalitet subscribe s'mund të lëshojë komanda të tjera, prandaj ndahen. `RealtimeGateway` pajtohet te channel-i `parking:spot-status` në `onModuleInit` dhe transmeton `spot:update` te `server.to(zoneId)`; **s'e prek DB-në** — shkrimi bëhet nga `SensorSimulatorService`, gateway-i vetëm ripërcjell. `SpotsModule` s'e eksportonte `SpotsService` (s'kishte nevojë deri në Fazën 2) — u shtua `exports: [SpotsService]` që `SensorSimulatorModule` ta injektojë. `@Interval()` e Nest-it merr vlerën e intervalit në kohën e ngarkimit të klasës (jo via DI/ConfigService) → përdoret `process.env.SENSOR_SIMULATOR_INTERVAL_MS` direkt (mjafton, pasi `ConfigModule.forRoot()` e populon `process.env` që në nisje). Migrimi i `SensorEvent` fillimisht donte të fshinte indekset GiST (Prisma s'i njeh si "të qëllimshme" pasi janë mbi kolona `Unsupported`) — u redaktua migration.sql para aplikimit për t'i ruajtur. Frontend: `import { Map } from "react-map-gl/maplibre"` përplasej me `Map` globale të JS-it (përdorur për `prevStatusRef`/`flashTimeoutsRef`) → riemërtuar `MapGL`. `react-hooks` (eslint) e re s'lejon mutim të `ref.current` gjatë render-it (`onSpotUpdateRef.current = onSpotUpdate`) → zhvendosur brenda `useEffect`. **Verifikuar tërësisht**: script Node me `socket.io-client` konfirmoi zinxhirin e plotë (simulator→DB→SensorEvent→Redis→Gateway→WS→klient); browser (DOM/tekst, jo WebGL) konfirmoi që statuset në listën e spoteve ndryshojnë live pa refresh faqeje.
