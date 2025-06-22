setup: setup.env

setup.env:
	asdf plugin add nodejs
	asdf plugin add pnpm
	asdf install

client.run:
	cd front && pnpm dev:front

server.run:
	cd app && pnpm dev:app
