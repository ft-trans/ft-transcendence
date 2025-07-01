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
	docker compose -f compose.dev.yaml up

.PHONY: down
down:
	docker compose -f compose.dev.yaml down


