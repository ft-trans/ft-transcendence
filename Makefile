setup: setup.env

setup.env:
	asdf plugin add nodejs
	asdf plugin add pnpm
	asdf install

client.run:
	cd front && pnpm run dev
