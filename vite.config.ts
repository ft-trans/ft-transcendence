import viteFastify from "@fastify/vite/plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type UserConfig } from "vite";

export default defineConfig(({ mode }: { mode: string }) => {
	const config: UserConfig = {
		build: {
			outDir: "dist",
		},
		plugins: [viteFastify({ spa: true }), tailwindcss()],
		root: import.meta.dirname,
	};

	if (mode === "production") {
		config.build = {
			...config.build,
			minify: "terser",
			sourcemap: false,
		};
		return config;
	}

	return {
		...config,
		server: {
			port: 3000,
			strictPort: true,
			open: true,
		},
	};
});
