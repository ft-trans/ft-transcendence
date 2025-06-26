setup: setup.env

setup.env:
	asdf plugin add nodejs
	asdf plugin add pnpm
	asdf plugin add sqlite
	asdf install

setup.db.dev:
	pnpm prisma migrate dev --name init

run:
	pnpm run dev
