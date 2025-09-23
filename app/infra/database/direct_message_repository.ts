import { DirectMessage } from "@domain/model/direct_message";
import { User, UserEmail, UserId } from "@domain/model/user";
import type { IDirectMessageRepository } from "@domain/repository/direct_message_repository";
import type { Client } from "./prisma";

// PrismaのUserモデルからドメインのUserモデルへ変換
const toUserDomain = (prismaUser: { id: string; email: string }): User => {
	return User.reconstruct(
		new UserId(prismaUser.id),
		new UserEmail(prismaUser.email),
	);
};

// PrismaのDirectMessageモデルからドメインのDirectMessageモデルへ変換
const toDirectMessageDomain = (prismaMessage: {
	id: string;
	content: string;
	isRead: boolean;
	sentAt: Date;
	sender: { id: string; email: string | null };
	receiver: { id: string; email: string | null };
}): DirectMessage => {
	const sender = toUserDomain(prismaMessage.sender);
	const receiver = toUserDomain(prismaMessage.receiver);

	return new DirectMessage(
		prismaMessage.id,
		sender,
		receiver,
		prismaMessage.content,
		prismaMessage.isRead,
		prismaMessage.sentAt,
	);
};

export class DirectMessageRepository implements IDirectMessageRepository {
	constructor(private readonly client: Client) {}

	async save(message: DirectMessage): Promise<DirectMessage> {
		const saved = await this.client.directMessage.create({
			data: {
				id: message.id,
				senderId: message.sender.id.value,
				receiverId: message.receiver.id.value,
				content: message.content,
				isRead: message.isRead,
				sentAt: message.sentAt,
			},
			include: {
				sender: true,
				receiver: true,
			},
		});
		return toDirectMessageDomain(saved);
	}

	async findById(messageId: string): Promise<DirectMessage | undefined> {
		const message = await this.client.directMessage.findUnique({
			where: {
				id: messageId,
			},
			include: {
				sender: true,
				receiver: true,
			},
		});

		if (!message) {
			return undefined;
		}

		return toDirectMessageDomain(message);
	}

	async update(message: DirectMessage): Promise<DirectMessage> {
		const updated = await this.client.directMessage.update({
			where: {
				id: message.id,
			},
			data: {
				content: message.content,
				isRead: message.isRead,
			},
			include: {
				sender: true,
				receiver: true,
			},
		});

		return toDirectMessageDomain(updated);
	}

	async findMessagesBetweenUsers(
		userId1: string,
		userId2: string,
	): Promise<DirectMessage[]> {
		const messages = await this.client.directMessage.findMany({
			where: {
				OR: [
					{ senderId: userId1, receiverId: userId2 },
					{ senderId: userId2, receiverId: userId1 },
				],
			},
			include: {
				sender: true,
				receiver: true,
			},
			orderBy: {
				sentAt: "asc",
			},
		});

		return messages.map(toDirectMessageDomain);
	}
}
