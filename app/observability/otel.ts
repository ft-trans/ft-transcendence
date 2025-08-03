import { metrics, trace } from "@opentelemetry/api";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { FastifyOtelInstrumentation } from "@fastify/otel";
import { PrismaInstrumentation } from "@prisma/instrumentation";   


const serviceName = process.env.OTEL_SERVICE_NAME ?? "fastify-app";
const metricsPort = Number(process.env.OTEL_METRICS_PORT ?? 9464);

const prometheusExporter = new PrometheusExporter(
	{ port: metricsPort, endpoint: "/metrics" },
	() => {
		console.log(`Prometheus metrics at http://localhost:${metricsPort}/metrics`);
	},
);

const fastifyOtelInstrumentation = new FastifyOtelInstrumentation({
	servername: serviceName,
	ignorePaths: (route) => route.url.startsWith("/api/health"),
});

const otelSDK = new NodeSDK({
	resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
	metricReader: prometheusExporter,
	instrumentations: [fastifyOtelInstrumentation, new HttpInstrumentation(), new PrismaInstrumentation({middleware: true,}),],
});

export const initializeOtel = async () => {
	await otelSDK.start();

	// Set global tracer and meter providers
	fastifyOtelInstrumentation.setTracerProvider(trace.getTracerProvider());
	fastifyOtelInstrumentation.setMeterProvider(metrics.getMeterProvider());
};

export const otelInstrumentation = fastifyOtelInstrumentation;