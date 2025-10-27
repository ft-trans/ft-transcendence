-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TournamentMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "matchId" TEXT,
    "winnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "TournamentRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TournamentMatch" ("createdAt", "id", "roundId", "status", "tournamentId", "winnerId") SELECT "createdAt", "id", "roundId", "status", "tournamentId", "winnerId" FROM "TournamentMatch";
DROP TABLE "TournamentMatch";
ALTER TABLE "new_TournamentMatch" RENAME TO "TournamentMatch";
CREATE UNIQUE INDEX "TournamentMatch_matchId_key" ON "TournamentMatch"("matchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
