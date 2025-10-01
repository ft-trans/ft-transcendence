COMPOSE_YML := compose.yaml

.PHONY: setup
setup: setup.env

.PHONY: setup.env
setup.env:
	asdf plugin add nodejs
	asdf plugin add pnpm
	asdf plugin add sqlite
	asdf install

.PHONY: db.migrate
db.migrate:
	pnpm prisma migrate dev

.PHONY: db.push
db.push:
	pnpm prisma db push

.PHONY: db.status
db.status:
	pnpm prisma migrate status

.PHONY: db.studio
db.studio:
	pnpm prisma studio

.PHONY: run
run:
	pnpm run dev:tsx

.PHONY: up
up: docker.up

.PHONY: down
down: docker.down

.PHONY: docker.up
docker.up:
	docker compose -f $(COMPOSE_YML) up -d

.PHONY: docker.down
docker.down:
	docker compose -f $(COMPOSE_YML) down

.PHONY: docker.build
docker.build:
	docker compose -f $(COMPOSE_YML) build --no-cache

.PHONY: docker.clean
docker.clean:
	docker compose -f $(COMPOSE_YML) down --rmi all -v

.PHONY: clean
clean:
	rm -rf dist
