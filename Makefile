COMPOSE_YML := compose.dev.yaml

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

.PHONY: run
run:
	pnpm run dev

.PHONY: up
up:
	docker compose -f $(COMPOSE_YML) up -d

.PHONY: down
down:
	docker compose -f $(COMPOSE_YML) down

.PHONY: clean_docker
clean_docker:
	docker compose -f $(COMPOSE_YML) down --rmi all -v

