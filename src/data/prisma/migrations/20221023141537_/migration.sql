/*
  Warnings:

  - The values [en,de,fr] on the enum `Languages` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Languages_new" AS ENUM ('EnglishUS', 'EnglishGB', 'German', 'Bulgarian', 'ChineseCN', 'ChineseTW', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Finnish', 'French', 'Greek', 'Hindi', 'Hungarian', 'Italian', 'Japanese', 'Korean', 'Lithuanian', 'Norwegian', 'Polish', 'PortugueseBR', 'Romanian', 'Russian', 'SpanishE', 'Swedish', 'Thai', 'Turkish', 'Ukrainian', 'Vietnamese');
ALTER TABLE "GuildSettings" ALTER COLUMN "language" DROP DEFAULT;
ALTER TABLE "GuildSettings" ALTER COLUMN "language" TYPE "Languages_new" USING ("language"::text::"Languages_new");
ALTER TYPE "Languages" RENAME TO "Languages_old";
ALTER TYPE "Languages_new" RENAME TO "Languages";
DROP TYPE "Languages_old";
ALTER TABLE "GuildSettings" ALTER COLUMN "language" SET DEFAULT 'EnglishUS';
COMMIT;

-- AlterTable
ALTER TABLE "GuildSettings" ALTER COLUMN "language" SET DEFAULT 'EnglishUS';
