/*
  Warnings:

  - The values [SpanishE] on the enum `Languages` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deezerPictureMedium` on the `UserData` table. All the data in the column will be lost.
  - You are about to drop the column `deezerTrackList` on the `UserData` table. All the data in the column will be lost.
  - You are about to drop the `DisabledCommands` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Languages_new" AS ENUM ('EnglishUS', 'EnglishGB', 'German', 'Bulgarian', 'ChineseCN', 'ChineseTW', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Finnish', 'French', 'Greek', 'Hindi', 'Hungarian', 'Italian', 'Japanese', 'Korean', 'Lithuanian', 'Norwegian', 'Polish', 'PortugueseBR', 'Romanian', 'Russian', 'SpanishES', 'Swedish', 'Thai', 'Turkish', 'Ukrainian', 'Vietnamese');
ALTER TABLE "GuildSettings" ALTER COLUMN "language" DROP DEFAULT;
ALTER TABLE "GuildSettings" ALTER COLUMN "language" TYPE "Languages_new" USING ("language"::text::"Languages_new");
ALTER TYPE "Languages" RENAME TO "Languages_old";
ALTER TYPE "Languages_new" RENAME TO "Languages";
DROP TYPE "Languages_old";
ALTER TABLE "GuildSettings" ALTER COLUMN "language" SET DEFAULT 'EnglishUS';
COMMIT;

-- DropForeignKey
ALTER TABLE "DisabledCommands" DROP CONSTRAINT "DisabledCommands_guildId_fkey";

-- AlterTable
ALTER TABLE "UserData" DROP COLUMN "deezerPictureMedium",
DROP COLUMN "deezerTrackList",
ADD COLUMN     "deezerImage" TEXT;

-- DropTable
DROP TABLE "DisabledCommands";
