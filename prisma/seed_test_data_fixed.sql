-- テストデータ用のSeeder SQL
-- DM機能とfriendship機能をテストするためのユーザーと関係データを作成

-- 既存データを削除
DELETE FROM Session;
DELETE FROM DirectMessage;
DELETE FROM Friendship;
DELETE FROM MatchHistory;
DELETE FROM MatchParticipant;
DELETE FROM Match;
DELETE FROM User;

-- テストユーザーを作成 (実際のULID形式のIDを使用、全員password123)
INSERT INTO User (id, username, email, passwordDigest, avatar, status, createdAt, updatedAt) VALUES 
('01K6R4WXGX6Z6J4HGHEYCWA0Y7', 'alice', 'alice@example.com', '$2b$10$kIYYtR0BORCXAaaB5eCyXOqi/xh5d8Ceu3qw2hx8Xg65jburKfyH2', '/avatars/alice.jpg', 'online', '2025-10-05 04:00:00', '2025-10-05 04:00:00'),
('01K6R4WXGYDCGN27EQ7PZ7SENN', 'bob', 'bob@example.com', '$2b$10$kIYYtR0BORCXAaaB5eCyXOqi/xh5d8Ceu3qw2hx8Xg65jburKfyH2', '/avatars/bob.jpg', 'online', '2025-10-05 04:00:00', '2025-10-05 04:00:00'),
('01K6R4WXGZ3CR7EXE41T7TKGTN', 'charlie', 'charlie@example.com', '$2b$10$kIYYtR0BORCXAaaB5eCyXOqi/xh5d8Ceu3qw2hx8Xg65jburKfyH2', '/avatars/charlie.jpg', 'offline', '2025-10-05 04:00:00', '2025-10-05 04:00:00'),
('01K6R4WXGZAAAAAAAAAAAAAAAA', 'diana', 'diana@example.com', '$2b$10$kIYYtR0BORCXAaaB5eCyXOqi/xh5d8Ceu3qw2hx8Xg65jburKfyH2', '/avatars/diana.jpg', 'online', '2025-10-05 04:00:00', '2025-10-05 04:00:00'),
('01K6R4WXGZBBBBBBBBBBBBBBBB', 'eve', 'eve@example.com', '$2b$10$kIYYtR0BORCXAaaB5eCyXOqi/xh5d8Ceu3qw2hx8Xg65jburKfyH2', '/avatars/eve.jpg', 'offline', '2025-10-05 04:00:00', '2025-10-05 04:00:00');

-- 友達関係を作成 (AliceとBob、AliceとCharlieが友達)
INSERT INTO Friendship (requesterId, receiverId, status, createdAt, updatedAt) VALUES 
('01K6R4WXGX6Z6J4HGHEYCWA0Y7', '01K6R4WXGYDCGN27EQ7PZ7SENN', 'accepted', datetime('now'), datetime('now')),
('01K6R4WXGYDCGN27EQ7PZ7SENN', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', 'accepted', datetime('now'), datetime('now')),
('01K6R4WXGX6Z6J4HGHEYCWA0Y7', '01K6R4WXGZ3CR7EXE41T7TKGTN', 'accepted', datetime('now'), datetime('now')),
('01K6R4WXGZ3CR7EXE41T7TKGTN', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', 'accepted', datetime('now'), datetime('now'));

-- 友達申請 (DianaからAliceへ)
INSERT INTO Friendship (requesterId, receiverId, status, createdAt, updatedAt) VALUES 
('01K6R4WXGZAAAAAAAAAAAAAAAA', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', 'pending', datetime('now'), datetime('now'));

-- サンプルダイレクトメッセージ
INSERT INTO DirectMessage (id, senderId, receiverId, content, isRead, sentAt) VALUES 
('01K6R4WXGZCCCCCCCCCCCCCCCC', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', '01K6R4WXGYDCGN27EQ7PZ7SENN', 'こんにちは、Bob！元気？', 1, datetime('now', '-2 hour')),
('01K6R4WXGZDDDDDDDDDDDDDDDD', '01K6R4WXGYDCGN27EQ7PZ7SENN', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', 'こんにちは、Alice！元気だよ。君はどう？', 1, datetime('now', '-90 minute')),
('01K6R4WXGZEEEEEEEEEEEEEEEE', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', '01K6R4WXGYDCGN27EQ7PZ7SENN', '私も元気だよ！今度一緒にゲームしない？', 1, datetime('now', '-60 minute')),
('01K6R4WXGZFFFFFFFFFFFFFF', '01K6R4WXGYDCGN27EQ7PZ7SENN', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', 'いいね！今度やろう', 0, datetime('now', '-30 minute')),
('01K6R4WXGZGGGGGGGGGGGGGGGG', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', '01K6R4WXGZ3CR7EXE41T7TKGTN', 'Charlie、プロジェクトの件どうだった？', 1, datetime('now', '-45 minute')),
('01K6R4WXGZHHHHHHHHHHHHHHHH', '01K6R4WXGZ3CR7EXE41T7TKGTN', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', 'うまくいったよ！ありがとう', 0, datetime('now', '-15 minute'));

-- Sessions table (ログイン用)
INSERT INTO Session (id, userId, tokenDigest, expiresAt, createdAt) VALUES 
('01K6R4WXGZIIIIIIIIIIIIIIII', '01K6R4WXGX6Z6J4HGHEYCWA0Y7', 'session_token_hash_1', datetime('now', '+1 day'), datetime('now')),
('01K6R4WXGZJJJJJJJJJJJJJJJJ', '01K6R4WXGYDCGN27EQ7PZ7SENN', 'session_token_hash_2', datetime('now', '+1 day'), datetime('now')),
('01K6R4WXGZKKKKKKKKKKKKKKK', '01K6R4WXGZ3CR7EXE41T7TKGTN', 'session_token_hash_3', datetime('now', '+1 day'), datetime('now'));