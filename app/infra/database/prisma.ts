// app/infra/database/prisma.ts
import { type Prisma, PrismaClient } from "@infra/database/generated";
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("fastify-app");

const prismaQueryCounter = meter.createCounter("prisma_client_queries_total", {
	description: "Total number of Prisma Client queries",
});
const prismaQueryDuration = meter.createHistogram(
	"prisma_client_queries_duration_ms",
	{ description: "Duration of Prisma Client queries (ms)", unit: "ms" },
);

const base = new PrismaClient();

const extended = base.$extends({
	query: {
		$allModels: {
			async $allOperations({ model, operation, args, query }) {
				const start = performance.now();
				let success = "true";
				try {
					const res = await query(args);
					return res;
				} catch (e) {
					success = "false";
					throw e;
				} finally {
					const dur = performance.now() - start;
					const attrs = {
						model: model ?? "unknown",
						operation,
						success,
					} as const;
					prismaQueryCounter.add(1, attrs);
					prismaQueryDuration.record(dur, attrs);
				}
			},
		},
	},
});

export const prisma = extended as unknown as Prisma.DefaultPrismaClient;

export type DBClient = Prisma.DefaultPrismaClient;
