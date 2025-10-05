import { Friendship } from "@domain/model/friendship";
import {
	User,
	UserAvatar,
	UserEmail,
	UserId,
	Username,
	type UserStatus,
	UserStatusValue,
} from "@domain/model/user";
import type { IFriendshipRepository } from "@domain/repository/friendship_repository";
import type { Client } from "./prisma";

// PrismaのUserモデルからドメインのUserモデルへ変換
const toUserDomain = (prismaUser: {
	id: string;
	email: string;
	username: string;
	avatar: string;
	status: string;
}): User => {
	return User.reconstruct(
		new UserId(prismaUser.id),
		new UserEmail(prismaUser.email),
		new Username(prismaUser.username),
		new UserAvatar(prismaUser.avatar),
		new UserStatusValue(prismaUser.status as UserStatus),
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

		// 重複を除去するためにSetを使用
		const friendsMap = new Map<string, User>();

		friendships.forEach((f) => {
			const friend =
				f.requesterId === userId
					? toUserDomain(f.receiver)
					: toUserDomain(f.requester);
			friendsMap.set(friend.id.value, friend);
		});

		return Array.from(friendsMap.values());
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
