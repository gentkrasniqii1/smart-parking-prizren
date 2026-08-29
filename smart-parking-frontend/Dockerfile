# Shih smart-parking-backend/Dockerfile: i njëjti pattern — target `dev` për
# docker-compose lokal (hot-reload), target-i default `runner` për prodhim.
# Shënim: Vercel (frontend, shih CLAUDE.md §2) e injoron këtë Dockerfile
# krejtësisht — ndërton nativisht me `next build`. Ky skedar shërben për
# self-hosting alternativ (Docker) dhe testim lokal të build-it të prodhimit.

FROM node:22-alpine AS base
WORKDIR /app
# Shih smart-parking-backend/Dockerfile: package-lock.json gjenerohet
# lokalisht me npm 11.x, node:22-alpine vjen me npm 10.x — `npm ci` i npm 10
# e refuzon si "jo në sinkron" pa këtë upgrade.
RUN npm install -g npm@11
COPY package.json package-lock.json ./

# ---- dev (përdorur nga docker-compose.yml, target: dev) ----
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- build (prodhim) ----
FROM base AS build
RUN npm ci
COPY . .
# NEXT_PUBLIC_* gdhenden në bundle-in e klientit NË KOHË BUILD-i, jo runtime
# — duhen si build-arg, jo thjesht env e kontejnerit.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
RUN npm run build

# ---- runtime (prodhim — target-i default, kërkon output:"standalone") ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
