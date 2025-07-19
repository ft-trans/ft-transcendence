import viteFastify from "@fastify/vite/plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		outDir: "dist",
		minify: "terser",
		sourcemap: false,
	},
	plugins: [viteFastify({ spa: true, dev: false }), tailwindcss()],
	root: import.meta.dirname,
});
