import { ApiClient } from "../api/api_client";
import { FloatingBanner } from "./floating_banner";

export interface GameInviteData {
	senderId: string;
	senderName: string;
}

export class GameInviteNotification {
	private apiClient = new ApiClient();

	show(inviteData: GameInviteData): void {
		const notification = document.createElement("div");
		notification.className = `
			fixed top-4 right-4 bg-white border-2 border-blue-500 rounded-lg shadow-lg p-4 z-50
			transform transition-all duration-300 ease-in-out translate-x-full
		`;
		notification.id = "game-invite-notification";

		notification.innerHTML = `
			<div class="flex items-center space-x-3">
				<div class="flex-shrink-0">
					<div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
						<span class="text-white font-bold text-lg">🎮</span>
					</div>
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-sm font-medium text-gray-900">
						ゲーム招待
					</div>
					<div class="text-sm text-gray-500">
						${inviteData.senderName}さんからゲームに招待されました
					</div>
				</div>
			</div>
			<div class="mt-3 flex space-x-2">
				<button 
					id="accept-invite-btn" 
					class="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
					data-sender-id="${inviteData.senderId}"
				>
					受理
				</button>
				<button 
					id="reject-invite-btn" 
					class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
					data-sender-id="${inviteData.senderId}"
				>
					拒否
				</button>
			</div>
		`;

		document.body.appendChild(notification);

		// Animate in
		setTimeout(() => {
			notification.classList.remove("translate-x-full");
		}, 100);

		// Set up event listeners
		this.setupEventListeners(notification, inviteData);

		// Auto-dismiss after 30 seconds
		setTimeout(() => {
			this.dismiss(notification);
		}, 30000);
	}

	private setupEventListeners(
		notification: HTMLElement,
		inviteData: GameInviteData,
	): void {
		const acceptBtn = notification.querySelector("#accept-invite-btn");
		const rejectBtn = notification.querySelector("#reject-invite-btn");

		acceptBtn?.addEventListener("click", () => {
			this.handleAccept(notification, inviteData);
		});

		rejectBtn?.addEventListener("click", () => {
			this.dismiss(notification);
		});

		// Close on click outside (optional)
		const closeOnOutsideClick = (event: MouseEvent) => {
			if (!notification.contains(event.target as Node)) {
				this.dismiss(notification);
				document.removeEventListener("click", closeOnOutsideClick);
			}
		};

		// Add the listener after a short delay to prevent immediate closing
		setTimeout(() => {
			document.addEventListener("click", closeOnOutsideClick);
		}, 500);
	}

	private async handleAccept(
		notification: HTMLElement,
		inviteData: GameInviteData,
	): Promise<void> {
		const acceptBtn = notification.querySelector(
			"#accept-invite-btn",
		) as HTMLButtonElement;

		if (acceptBtn) {
			acceptBtn.disabled = true;
			acceptBtn.textContent = "参加中...";
		}

		try {
			// Send acceptance response to backend (implement this API endpoint)
			const response = await this.apiClient.post("/api/game/invite/accept", {
				senderId: inviteData.senderId,
			}) as { success: boolean; matchId?: string };

			new FloatingBanner({
				message: "ゲームに参加しています...",
				type: "success",
			}).show();

			this.dismiss(notification);

			// Navigate to game page
			const router = await import("../router");
			if (response.matchId) {
				router.navigateTo(`/pong/matches/${response.matchId}`);
			} else {
				// Fallback to matchmaking page if no match ID
				router.navigateTo("/matchmaking");
			}
		} catch (error) {
			console.error("Failed to accept game invite:", error);

			new FloatingBanner({
				message: "ゲーム参加に失敗しました",
				type: "error",
			}).show();

			// Re-enable button
			if (acceptBtn) {
				acceptBtn.disabled = false;
				acceptBtn.textContent = "受理";
			}
		}
	}

	private dismiss(notification: HTMLElement): void {
		notification.classList.add("translate-x-full");

		setTimeout(() => {
			if (notification.parentNode) {
				notification.parentNode.removeChild(notification);
			}
		}, 300);
	}

	// Static method to dismiss any existing notifications
	static dismissAll(): void {
		const existingNotifications = document.querySelectorAll(
			"#game-invite-notification",
		);
		existingNotifications.forEach((notification) => {
			notification.classList.add("translate-x-full");
			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification);
				}
			}, 300);
		});
	}
}
