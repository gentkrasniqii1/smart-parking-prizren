# Multi-stage me target-e të emërtuara: `dev` (docker-compose lokal, watch +
# volume-mount) dhe target-i default `runner` (prodhim — Railway/Render e
# ndërtojnë pa `--target`, kështu që marrin automatikisht stage-in e fundit).

FROM node:22-alpine AS base
WORKDIR /app
# node:22-alpine vjen me npm 10.x; package-lock.json gjenerohet lokalisht me
# npm 11.x — `npm ci` i npm 10 e refuzon si "jo në sinkron" (validim më i
# rreptë mes versioneve major të npm-it, jo problem real i lock file-it).
RUN npm install -g npm@11
COPY package.json package-lock.json ./
# `prisma/` kopjohet KËTU (jo vetëm te `COPY . .` më poshtë) — `npm ci`
# nis vetë `postinstall` → `prisma generate`, i cili kërkon schema.prisma të
# pranishme; pa këtë, `npm ci` dështon me "Could not find Prisma Schema".
# Prek pak cache-in e Docker layer-it (ndryshimet te schema e ribëjnë `npm ci`)
# por mbetet shumë më efikas se kopjimi i GJITHË burimit para `npm ci`.
COPY prisma ./prisma

# ---- dev (përdorur nga docker-compose.yml, target: dev) ----
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# ---- build (prodhim) ----
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime (prodhim — target-i default) ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# node_modules e plotë (jo vetëm prod) — na duhet CLI-ja e `prisma` (dev
# dependency) në runtime për `migrate deploy` në nisje; thjeshtësi mbi
# optimizim madhësie, i pranueshëm për shtrirjen e këtij projekti.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3001

# `migrate deploy` (jo `migrate dev`) — vetëm aplikon migrimet ekzistuese,
# s'gjeneron të reja dhe s'kërkon input interaktiv; i sigurt të rirendet në
# çdo nisje kontejneri (idempotent, i mbrojtur nga Prisma advisory lock).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
