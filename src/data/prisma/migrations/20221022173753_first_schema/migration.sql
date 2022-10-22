-- CreateEnum
CREATE TYPE "Languages" AS ENUM ('en', 'de', 'fr');

-- CreateTable
CREATE TABLE "GuildSettings" (
    "guildId" TEXT NOT NULL,
    "defaultvolume" INTEGER NOT NULL DEFAULT 100,
    "defaultautoplay" BOOLEAN NOT NULL DEFAULT true,
    "language" "Languages" NOT NULL DEFAULT 'en',
    "ephemeralNowPlaying" BOOLEAN NOT NULL DEFAULT true,
    "extraData" JSONB,

    CONSTRAINT "GuildSettings_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "UserData" (
    "userId" TEXT NOT NULL,
    "songHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commandHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deezerToken" TEXT,
    "deezerId" TEXT,
    "extraData" JSONB,

    CONSTRAINT "UserData_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Lyrics" (
    "trackId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lyrics" TEXT NOT NULL,

    CONSTRAINT "Lyrics_pkey" PRIMARY KEY ("trackId")
);

-- CreateTable
CREATE TABLE "DJSettings" (
    "guildId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "access" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "djonlycommands" TEXT[] DEFAULT ARRAY['bassboost', 'bettermusiceq', 'clearfilters', 'echo', 'karaoke', 'lowpass', 'nightcore', 'pitch', 'rate', 'pop', 'speed', 'rotating', 'resume', 'rewind', 'seek', 'shuffle', 'skip', 'stop', 'stoploop', 'unshuffle', 'volume', 'autoplay', 'clearqueue', 'forward', 'jump', 'leave', 'loop', 'move', 'pause', 'playskip', 'playtop', 'removedupes', 'replay', 'tremolo']::TEXT[],
    "extraData" JSONB,

    CONSTRAINT "DJSettings_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "DisabledCommands" (
    "guildId" TEXT NOT NULL,
    "commands" TEXT[],
    "slashCommands" TEXT[],

    CONSTRAINT "DisabledCommands_pkey" PRIMARY KEY ("guildId")
);
