FROM node:22-bookworm-slim AS base

WORKDIR /app

RUN set -x \
	&& apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y \
    # use for healthcheck
    curl \
    sqlite3 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm


FROM base AS build

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN set -x \
  && pnpm prisma generate \
  && pnpm prisma migrate deploy \
  && pnpm run build:production


FROM base AS dependency

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod --ignore-scripts


FROM base AS production

ENV NODE_ENV=production

WORKDIR /app

RUN groupadd -r app && useradd -r -g app app

COPY --from=build /app/dist /app/dist
COPY --from=build /app/app/infra/database/generated /app/dist/app/infra/database/generated
COPY --from=build /app/prisma /app/dist/prisma
COPY --from=dependency /app/node_modules /app/node_modules

RUN set -x \
  && chown -R app:app /app

USER app

EXPOSE 3000

CMD ["node", "--import", "./dist/app/observability/instrument.js", "dist/app/main.js"]
