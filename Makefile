setup: setup.env

setup.env:
	asdf plugin add nodejs
	asdf plugin add pnpm
	asdf plugin add sqlite
	asdf plugin add redis
	asdf install

db.migrate:
	pnpm prisma migrate dev

run:
	redis-server redis/redis.dev.conf
	pnpm run dev

stop:
	redis-cli shutdown
