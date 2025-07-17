FROM node:22-bookworm-slim AS development

# used for database migration
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /app

RUN set -x \
	&& apt-get update \
	&& apt-get install --no-install-recommends --no-install-suggests -y \
    # used for healthcheck
    curl \
    sqlite3 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma migrate dev

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
