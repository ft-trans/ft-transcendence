-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DirectMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DirectMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DirectMessage" ("content", "id", "isRead", "receiverId", "senderId", "sentAt") SELECT "content", "id", "isRead", "receiverId", "senderId", "sentAt" FROM "DirectMessage";
DROP TABLE "DirectMessage";
ALTER TABLE "new_DirectMessage" RENAME TO "DirectMessage";
CREATE TABLE "new_Friendship" (
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("requesterId", "receiverId"),
    CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Friendship" ("createdAt", "receiverId", "requesterId", "status", "updatedAt") SELECT "createdAt", "receiverId", "requesterId", "status", "updatedAt" FROM "Friendship";
DROP TABLE "Friendship";
ALTER TABLE "new_Friendship" RENAME TO "Friendship";
CREATE TABLE "new_MatchHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "loserId" TEXT NOT NULL,
    "winnerScore" INTEGER NOT NULL,
    "loserScore" INTEGER NOT NULL,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchHistory_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchHistory_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchHistory_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MatchHistory" ("id", "loserId", "loserScore", "matchId", "playedAt", "winnerId", "winnerScore") SELECT "id", "loserId", "loserScore", "matchId", "playedAt", "winnerId", "winnerScore" FROM "MatchHistory";
DROP TABLE "MatchHistory";
ALTER TABLE "new_MatchHistory" RENAME TO "MatchHistory";
CREATE UNIQUE INDEX "MatchHistory_matchId_key" ON "MatchHistory"("matchId");
CREATE TABLE "new_MatchParticipant" (
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("matchId", "userId"),
    CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MatchParticipant" ("matchId", "userId") SELECT "matchId", "userId" FROM "MatchParticipant";
DROP TABLE "MatchParticipant";
ALTER TABLE "new_MatchParticipant" RENAME TO "MatchParticipant";
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "organizerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registration',
    "maxParticipants" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tournament_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("createdAt", "description", "id", "maxParticipants", "name", "organizerId", "status", "updatedAt") SELECT "createdAt", "description", "id", "maxParticipants", "name", "organizerId", "status", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE TABLE "new_TournamentMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "matchId" TEXT,
    "winnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "TournamentRound" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TournamentMatch" ("createdAt", "id", "matchId", "roundId", "status", "tournamentId", "winnerId") SELECT "createdAt", "id", "matchId", "roundId", "status", "tournamentId", "winnerId" FROM "TournamentMatch";
DROP TABLE "TournamentMatch";
ALTER TABLE "new_TournamentMatch" RENAME TO "TournamentMatch";
CREATE UNIQUE INDEX "TournamentMatch_matchId_key" ON "TournamentMatch"("matchId");
CREATE TABLE "new_TournamentMatchParticipant" (
    "matchId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,

    PRIMARY KEY ("matchId", "participantId"),
    CONSTRAINT "TournamentMatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatchParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "TournamentParticipant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TournamentMatchParticipant" ("matchId", "participantId") SELECT "matchId", "participantId" FROM "TournamentMatchParticipant";
DROP TABLE "TournamentMatchParticipant";
ALTER TABLE "new_TournamentMatchParticipant" RENAME TO "TournamentMatchParticipant";
CREATE TABLE "new_TournamentParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "TournamentParticipant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TournamentParticipant" ("id", "status", "tournamentId", "userId") SELECT "id", "status", "tournamentId", "userId" FROM "TournamentParticipant";
DROP TABLE "TournamentParticipant";
ALTER TABLE "new_TournamentParticipant" RENAME TO "TournamentParticipant";
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_userId_key" ON "TournamentParticipant"("tournamentId", "userId");
CREATE TABLE "new_TournamentRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentRound_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TournamentRound" ("createdAt", "id", "roundNumber", "status", "tournamentId") SELECT "createdAt", "id", "roundNumber", "status", "tournamentId" FROM "TournamentRound";
DROP TABLE "TournamentRound";
ALTER TABLE "new_TournamentRound" RENAME TO "TournamentRound";
CREATE UNIQUE INDEX "TournamentRound_tournamentId_roundNumber_key" ON "TournamentRound"("tournamentId", "roundNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
