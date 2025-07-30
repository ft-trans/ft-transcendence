import { resolve } from "node:path";
import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";
import Fastify from "fastify";

// OpenTelemetry core
import { NodeSDK } from "@opentelemetry/sdk-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { FastifyOtelInstrumentation } from "@fastify/otel";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { metrics, trace } from "@opentelemetry/api";

const serviceName = process.env.OTEL_SERVICE_NAME ?? "fastify-app";
const metricsPort = Number(process.env.OTEL_METRICS_PORT ?? 9464);

const prometheusExporter = new PrometheusExporter(
	{ port: metricsPort, endpoint: "/metrics" },
	() =>
		console.log(
			`Prometheus metrics at http://localhost:${metricsPort}/metrics`,
		),
);

const fastifyOtelInstrumentation = new FastifyOtelInstrumentation({
	servername: serviceName,
	ignorePaths: (route) => route.url.startsWith("/api/health"),
});

const otelSDK = new NodeSDK({
	resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
	metricReader: prometheusExporter,
	instrumentations: [fastifyOtelInstrumentation, new HttpInstrumentation()],
});
await otelSDK.start();

fastifyOtelInstrumentation.setTracerProvider(trace.getTracerProvider());
fastifyOtelInstrumentation.setMeterProvider(metrics.getMeterProvider());

const app = Fastify({ logger: true });
await app.register(fastifyOtelInstrumentation.plugin());

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
		await app.listen({ host: "0.0.0.0", port: 3000 });
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
