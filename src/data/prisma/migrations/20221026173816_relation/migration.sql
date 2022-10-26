-- AlterTable
ALTER TABLE "UserData" ADD COLUMN     "deezerName" TEXT,
ADD COLUMN     "deezerPictureMedium" TEXT,
ADD COLUMN     "deezerTrackList" TEXT;

-- AddForeignKey
ALTER TABLE "DJSettings" ADD CONSTRAINT "DJSettings_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildSettings"("guildId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisabledCommands" ADD CONSTRAINT "DisabledCommands_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildSettings"("guildId") ON DELETE RESTRICT ON UPDATE CASCADE;
