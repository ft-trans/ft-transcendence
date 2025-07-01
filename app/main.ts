import { resolve } from "node:path";
import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";
import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/api/health", async (_req, _reply) => {
	return { message: "OK" };
});

const start = async () => {
	try {
		await app.register(FastifyVite, {
			root: resolve(import.meta.dirname, ".."),
			distDir: resolve(import.meta.dirname, ".."),
			dev: process.argv.includes("--dev"),
			spa: true,
		});

		const redis_url = process.env.REDIS_URL;
		if (!redis_url) {
			app.log.error(
				"REDIS_URL environment variable is missing. Please set it before starting the application.",
			);
			process.exit(1);
		}
		await app.register(FastifyRedis, {
			url: redis_url,
		});

		app.get("/", (_req, reply) => {
			return reply.html();
		});

		await app.vite.ready();
		await app.listen({ port: 3000 });
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
