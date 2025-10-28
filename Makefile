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

.PHONY: db.seed
db.seed:
	sqlite3 prisma/transcendence_dev.sqlite3 < prisma/seed_test_data_fixed.sql

.PHONY: db.reset
db.reset:
	pnpm prisma migrate reset --force
	sqlite3 prisma/transcendence_dev.sqlite3 < prisma/seed_test_data_fixed.sql

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

.PHONY: gen_certs
gen_certs:
	./deploy/nginx/scripts/generate_certs.sh

.PHONY: clean
clean:
	rm -rf dist

.PHONY: secrets.generate
secrets.generate:
	@mkdir -p secrets
	@[ -f secrets/elasticsearch_password.txt ] || (umask 077 && openssl rand -base64 8 | tr -d '\r\n' > secrets/elasticsearch_password.txt)
	@[ -f secrets/kibana_password.txt ]        || (umask 077 && openssl rand -base64 8 | tr -d '\r\n' > secrets/kibana_password.txt)
	@[ -f secrets/grafana_admin_password.txt ] || (umask 077 && openssl rand -base64 8 | tr -d '\r\n' > secrets/grafana_admin_password.txt)
	@[ -f secrets/kbn_eso_key.txt ]       || (umask 077 && openssl rand -base64 32 | tr -d '\r\n' > secrets/kbn_eso_key.txt)
	@[ -f secrets/kbn_reporting_key.txt ] || (umask 077 && openssl rand -base64 32 | tr -d '\r\n' > secrets/kbn_reporting_key.txt)
	@[ -f secrets/kbn_security_key.txt ]  || (umask 077 && openssl rand -base64 32 | tr -d '\r\n' > secrets/kbn_security_key.txt)
	@echo "local secrets generated"

.PHONY: secrets.check
secrets.check:
	@test -s secrets/elasticsearch_password.txt
	@test -s secrets/kibana_password.txt
	@test -s secrets/kbn_eso_key.txt
	@test -s secrets/kbn_reporting_key.txt
	@test -s secrets/kbn_security_key.txt
	@echo "secrets.check passed"
