// the following line is needed to extend the types for vitest
/// <reference types="vitest/config" />
import viteFastify from "@fastify/vite/plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	build: {
		outDir: "dist",
	},
	plugins: [viteFastify({ spa: true }), tailwindcss(), tsconfigPaths()],
	root: import.meta.dirname,
	server: {
		port: 3000,
		strictPort: true,
		open: true,
	},
	test: {
		coverage: {
			reporter: ["text", "json-summary", "json"],
			reportOnFailure: true,
		},
	},
});
