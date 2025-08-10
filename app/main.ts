import { resolve } from "node:path";

import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";

import Fastify from "fastify";

import { PrismaClient } from "./infra/database/generated/index.js";

import { initializeOtel, otelInstrumentation } from "./observability/otel.js";

const app = Fastify({ logger: true });

const start = async () => {
	try {
		const prisma = new PrismaClient();

		app.get("/api/health", async (_req, _reply) => {
			return { message: "OK" };
		});

		app.get("/metrics", async (_req, _reply) => {
			_reply.type("text/plain").send(await prisma.$metrics.prometheus());
		});

		await initializeOtel();

		await app.register(otelInstrumentation.plugin());

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

		app.get("/", (_req, _reply) => {
			return _reply.html();
		});

		await app.vite.ready();
		await app.listen({ host: "0.0.0.0", port: 3000 });
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
