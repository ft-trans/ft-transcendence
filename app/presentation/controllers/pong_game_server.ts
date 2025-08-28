import type { CalcPongStateUsecase } from "@usecase/pong/calc_pong_state_usecase";
import type { EndPongUsecase } from "@usecase/pong/end_pong_usecase";
import type { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import WebSocket from "ws";

export class PongGameServer {
	private readonly connectedClients = new Map<string, Set<WebSocket>>();
	private intervalId: NodeJS.Timeout | undefined;

	constructor(
		private readonly getPongStateUsecase: CalcPongStateUsecase,
		private readonly startPongUsecase: StartPongUsecase,
		private readonly endPongUsecase: EndPongUsecase,
	) {
		this.intervalId = undefined;
	}

	addClient(matchId: string, socket: WebSocket) {
		if (!this.connectedClients.has(matchId)) {
			this.connectedClients.set(matchId, new Set<WebSocket>());
			this.startPongUsecase.execute({ matchId });
		}
		this.connectedClients.get(matchId)?.add(socket);
	}

	deleteClient(matchId: string, socket: WebSocket) {
		this.connectedClients.get(matchId)?.delete(socket);
		if (this.connectedClients.get(matchId)?.size === 0) {
			this.connectedClients.delete(matchId);
			this.endPongUsecase.execute({ matchId });
		}
	}

	run() {
		if (this.intervalId) {
			return;
		}

		this.intervalId = setInterval(() => {
			this.connectedClients.forEach(
				(clients: Set<WebSocket>, matchId: string) => {
					this.sendPongGameState(matchId, clients);
				},
			);
		}, 1000 / 60); // 60 FPS
	}

	shutdown() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
	}

	startMatch(matchId: string) {
		this.startPongUsecase.execute({ matchId });
	}

	private sendPongGameState(matchId: string, clients: Set<WebSocket>) {
		this.getPongStateUsecase.execute({ matchId }).then((state) => {
			clients.forEach((client: WebSocket) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(
						JSON.stringify({
							event: "gameState",
							matchId: matchId,
							payload: state.toPayload(),
						}),
					);
				} else {
					this.deleteClient(matchId, client);
				}
			});
		});
	}
}

// for fastify plugin
interface PongGameServerOptions {
	calcPongStateUsecase: CalcPongStateUsecase;
	startPongUsecase: StartPongUsecase;
	endPongUsecase: EndPongUsecase;
}

// register as a Fastify plugin
const pongGameServerPlugin: FastifyPluginCallback<PongGameServerOptions> = (
	fastify: FastifyInstance,
	options: PongGameServerOptions,
	done,
) => {
	const pongGameServer = new PongGameServer(
		options.calcPongStateUsecase,
		options.startPongUsecase,
		options.endPongUsecase,
	);

	fastify.decorate("pongGameServer", pongGameServer);

	pongGameServer.run();

	fastify.addHook("onClose", async () => {
		pongGameServer.shutdown();
	});

	done();
};

// wrap with fastify-plugin to export the type declaration
export default fp(pongGameServerPlugin, {
	name: "pong-game-server",
	fastify: "5.x",
});
