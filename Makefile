setup: setup.env

setup.env:
	asdf plugin add nodejs
	asdf plugin add pnpm
	asdf install

run:
	pnpm run dev
