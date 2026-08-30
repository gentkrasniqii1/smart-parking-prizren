-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerificationTokenHash" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT;

-- Backfill: user-at e krijuar tashmë via Google e kanë email-in të
-- verifikuar nga vetë Google — s'ka kuptim t'u kërkojmë verifikim shtesë.
UPDATE "users" SET "emailVerified" = true WHERE "googleId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "users_emailVerificationTokenHash_idx" ON "users"("emailVerificationTokenHash");

-- CreateIndex
CREATE INDEX "users_passwordResetTokenHash_idx" ON "users"("passwordResetTokenHash");

-- NDIKIM: Prisma-migrate-diff-i i vet e trajton "USING GIST" mbi kolona
-- Unsupported(geometry(...)) si të pa-njohura dhe donte t'i FSHINTE indekset
-- hapësinore ekzistuese (parking_spots_location_gist_idx,
-- parking_zones_polygon_gist_idx, shtuar te migrimi
-- 20260829015057_add_spatial_indexes) — saktësisht i njëjti kurth i
-- dokumentuar te CLAUDE.md §8 (Faza 3). Ky skedar u redaktua për t'i hequr
-- ato DROP INDEX PARA se ta rilexosh; nëse e rindërton DB-në nga zero, ky
-- migrim NUK i rikrijon vetë ato dy indekse (mbeten te migrimi origjinal
-- 20260829015057) — thjesht s'i prek fare tani.
