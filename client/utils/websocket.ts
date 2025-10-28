/**
 * Utility functions for WebSocket URL construction
 */

/**
 * Constructs a WebSocket URL for the given path
 * Uses VITE_WS_URL environment variable if available, otherwise falls back to location-based URL
 * @param path The WebSocket path (e.g., '/ws/matchmaking')
 * @returns Complete WebSocket URL
 */
export function buildWebSocketUrl(path: string): string {
	const baseWsUrl = import.meta.env.VITE_WS_URL;

	if (baseWsUrl) {
		return `${baseWsUrl}${path}`;
	}

	// Fallback to location-based URL
	const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
	return `${wsProtocol}//${location.host}${path}`;
}
