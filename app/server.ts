import { initializeOtel } from "./observability/otel.js";

await initializeOtel();

await import("./main.js");