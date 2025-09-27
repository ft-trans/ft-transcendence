// app/observability/otel.ts
import { FastifyOtelInstrumentation } from "@fastify/otel";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";

const serviceName = "fastify-app";
const otlpEndpoint =
	process.env.OTEL_EXPORTER_OTLP_ENDPOINT_TRACE || "http://localhost:4317";

export const prometheusExporter = new PrometheusExporter({
	port: Number(process.env.OTEL_METRICS_PORT ?? 9464),
	endpoint: "/metrics",
});

export const otelInstrumentation = new FastifyOtelInstrumentation({
	servername: serviceName,
	ignorePaths: (route) => route.url.startsWith("/api/health"),
});

const traceExporter = new OTLPTraceExporter({ url: otlpEndpoint });

const sdk = new NodeSDK({
	resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
	metricReader: prometheusExporter,
	spanProcessor: new BatchSpanProcessor(traceExporter),
	instrumentations: [
		otelInstrumentation,
		new HttpInstrumentation(),
		new PrismaInstrumentation({}),
	],
});

sdk.start();
