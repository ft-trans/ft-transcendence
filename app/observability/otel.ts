import { FastifyOtelInstrumentation } from "@fastify/otel";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";

const serviceName = process.env.OTEL_SERVICE_NAME ?? "fastify-app";

export const prometheusExporter = new PrometheusExporter({
	preventServerStart: true,
});

const fastifyOtelInstrumentation = new FastifyOtelInstrumentation({
	servername: serviceName,
	ignorePaths: (route) => route.url.startsWith("/api/health"),
});

const otelSDK = new NodeSDK({
	resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
	metricReader: prometheusExporter,
	instrumentations: [
		fastifyOtelInstrumentation,
		new HttpInstrumentation(),
		new PrismaInstrumentation({}),
	],
});

export const initializeOtel = async () => {
	await otelSDK.start();
};

export const otelInstrumentation = fastifyOtelInstrumentation;
