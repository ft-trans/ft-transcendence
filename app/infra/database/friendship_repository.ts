import { Friendship } from "@domain/model/friendship";
import { User, UserEmail, UserId } from "@domain/model/user";
import type { IFriendshipRepository } from "@domain/repository/friendship_repository";
import type { Client } from "../repository";

// PrismaのUserモデルからドメインのUserモデルへ変換
const toUserDomain = (prismaUser: { id: string; email: string }): User => {
	return User.reconstruct(
		new UserId(prismaUser.id),
		new UserEmail(prismaUser.email),
	);
};

// PrismaのFriendshipモデルからドメインのFriendshipモデルへ変換
const toFriendshipDomain = (prismaFriendship: {
	requesterId: string;
	receiverId: string;
	status: string;
}): Friendship => {
	// PrismaのFriendshipStatus型はstringとして扱われるためキャスト
	const status = prismaFriendship.status as "pending" | "accepted" | "blocked";
	return new Friendship(
		new UserId(prismaFriendship.requesterId),
		new UserId(prismaFriendship.receiverId),
		status,
	);
};

export class FriendshipRepository implements IFriendshipRepository {
	constructor(private readonly client: Client) {}

	async save(friendship: Friendship): Promise<Friendship> {
		const saved = await this.client.friendship.upsert({
			where: {
				requesterId_receiverId: {
					requesterId: friendship.requesterId.value,
					receiverId: friendship.receiverId.value,
				},
			},
			update: {
				status: friendship.status,
			},
			create: {
				requesterId: friendship.requesterId.value,
				receiverId: friendship.receiverId.value,
				status: friendship.status,
			},
		});
		return toFriendshipDomain(saved);
	}

	async findByUserIds(
		userId1: string,
		userId2: string,
	): Promise<Friendship | undefined> {
		const friendship = await this.client.friendship.findFirst({
			where: {
				OR: [
					{ requesterId: userId1, receiverId: userId2 },
					{ requesterId: userId2, receiverId: userId1 },
				],
			},
		});
		return friendship ? toFriendshipDomain(friendship) : undefined;
	}

	async findFriendsByUserId(userId: string): Promise<User[]> {
		const friendships = await this.client.friendship.findMany({
			where: {
				status: "accepted",
				OR: [{ requesterId: userId }, { receiverId: userId }],
			},
			include: {
				requester: true,
				receiver: true,
			},
		});

		return friendships.map((f) =>
			f.requesterId === userId
				? toUserDomain(f.receiver)
				: toUserDomain(f.requester),
		);
	}

	async findPendingRequestsByReceiverId(userId: string): Promise<Friendship[]> {
		const pending = await this.client.friendship.findMany({
			where: {
				receiverId: userId,
				status: "pending",
			},
		});
		return pending.map(toFriendshipDomain);
	}

	async delete(friendship: Friendship): Promise<void> {
		await this.client.friendship.delete({
			where: {
				requesterId_receiverId: {
					requesterId: friendship.requesterId.value,
					receiverId: friendship.receiverId.value,
				},
			},
		});
	}
}
