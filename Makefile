setup: setup.env

setup.env:
	asdf plugin add nodejs
	asdf plugin add pnpm
	asdf plugin add sqlite
	asdf install

db.migrate:
	pnpm prisma migrate dev

run:
	pnpm run dev
