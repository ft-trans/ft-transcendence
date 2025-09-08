import { FastifyOtelInstrumentation } from "@fastify/otel";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";

const serviceName = process.env.OTEL_SERVICE_NAME ?? "fastify-app";
const metricsPort = Number(process.env.OTEL_METRICS_PORT ?? 9464);

export const prometheusExporter = new PrometheusExporter({
	port: metricsPort, 
	endpoint: "/metrics"
});

const fastifyOtelInstrumentation = new FastifyOtelInstrumentation({
	servername: serviceName,
	ignorePaths: (route) => route.url.startsWith("/api/health"),
});

const otlpTraceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT_TRACE || 'http://localhost:4317',
});

const otelSDK = new NodeSDK({
	resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
	metricReader: prometheusExporter,
	spanProcessor: new BatchSpanProcessor(otlpTraceExporter),
	instrumentations: [
		fastifyOtelInstrumentation,
		new HttpInstrumentation(),
		new PrismaInstrumentation({}),
	],
});

otelSDK.start();

export const otelInstrumentation = fastifyOtelInstrumentation;
