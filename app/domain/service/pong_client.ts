export interface IPongClient {
	isOpen(): boolean;
	send(data: string): void;
	close(): void;
}
