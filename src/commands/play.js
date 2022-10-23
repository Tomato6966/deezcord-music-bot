import { TrackUtils } from "erela.js";
import { optionTypes } from "../structures/BotClient.mjs";

/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "play",
    description: "Play a song / query inside your Voice-Channel",
    options: [
        {
            name: "query",
            description: "Song/Playlist Name/Link",
            required: true,
            type: optionTypes.string,
            // autocomplete: true,
        },
        {
            name: "file",
            description: "Play a file instead (overrides query)",
            required: false,
            type: optionTypes.attachment,
        },
        {
            name: "queueaction",
            description: "Any extra Queue Actions wanted?",
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {name: "skip", value: "skip" },
                {name: "addontop", value: "addontop" },
            ]
        }
    ],
    async execute(client, interaction) {
        let player = client.DeezCord.players.get(interaction.guildId);
        const created = !player;
        let previousQueue = player?.queue?.totalSize ?? 0;
        if (!player) {
            player = client.DeezCord.create({
                region: interaction.member.voice.channel?.rtcRegion || undefined,
                guild: interaction.guildId,
                voiceChannel: interaction.member.voice.channel.id, // message.member.voice.channel.id,
                textChannel: interaction.channel.id,
                selfDeafen: true,
            });
            player.connect();
            player.stop();
        }
        const notConnectedNodes = client.DeezCord.nodes.filter(n => n.connected);
        if(notConnectedNodes.length) {
            for(const node of notConnectedNodes) await node.connect();
            await client.DeezUtils.time.delay(500 * notConnectedNodes.length);
        }
        /*
        const login = client.db.userData.findFirst({
            where: { userId: interaction.user.id },
            select: {
                deezerId: true, deezerToken: true
            }
        });
        if(!login || !login.deezerToken) return interaction.reply({
            ephemeral: true,
            content: `❌ You have to be logged in to Deezer, do it with: ${client.commands.get("login")?.mention || "`/login`"}`
        });*/
        const query = interaction.options.getString("query");
        await interaction.reply({
            ephemeral: true,
            content: `Now searching for: ${query}`
        });

        // if(link) extractId and search for right query  
        let searchingTracks = null;
        let loadType = "TRACKS_FOUND";
        if(query.match(client.DeezRegex)) {
            const [,,,type,id] = query.match(client.DeezRegex);
            if(type === "track") searchingTracks = [await client.DeezApi.deezer.fetch.track(id).then(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user)).catch((e) => {console.warn(e); return null;})]
            else if(type === "playlist") {
                loadType = "PLAYLIST_LOADED";
                searchingTracks = await client.DeezApi.deezer.fetch.playlist(id, true).then(x => (x?.tracks?.data||x?.tracks||[]).map(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user))).catch((e) => {console.warn(e); return null;});
            }
            else if(type === "artist") {
                loadType = "ARTIST_LOADED";
                searchingTracks = await client.DeezApi.deezer.fetch.playlist(id, true).then(x => (x?.tracks?.data||x?.tracks||[]).map(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user))).catch((e) => {console.warn(e); return null;});
            }
            else if(type === "album") {
                loadType = "ALBUM_LOADED";
                searchingTracks = await client.DeezApi.deezer.fetch.playlist(id, true).then(x => (x?.tracks?.data||x?.tracks||[]).map(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user))).catch((e) => {console.warn(e); return null;});
            }
            else if(type === "radio") {
                loadType = "RADIO_LOADED";
                searchingTracks = await client.DeezApi.deezer.fetch.playlist(id, true).then(x => (x?.tracks?.data||x?.tracks||[]).map(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user))).catch((e) => {console.warn(e); return null;});
            }
        } else {
            searchingTracks = await client.DeezApi.deezer.search.tracks(query).then(x => (x?.data || []).map(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user)));
        }
        const response = searchingTracks?.length ? { loadType, tracks: searchingTracks } : await client.DeezCord.search(query, interaction.user, player.node);
        if(!response.tracks) return interaction.editReply({
            ephemeral: true,
            content: `❌ No Tracks found`
        });
        const playlistResponse = response.loadType === `PLAYLIST_LOADED`;
        // if a player was created, or the previous queue was empty, or there was no player before
        if (created || previousQueue === 0) {
            // Add the Track(s)
            if (playlistResponse) player.queue.add(response.tracks)
            else player.queue.add(response.tracks[0]);
            // Play the song with default options
            player.play({
                pause: false,
                volume: await client.db.guildSettings.findFirst({
                    where: { guildId: interaction.guildId },
                    select: { defaultvolume: true }
                }).then(x => x?.defaultvolume || 100),
                startTime: 0,
            });
            if(playlistResponse) console.log(player.queue.size);
            //if(!player.queue.current.uri && contentURL) player.queue.current.uri = contentURL;
            if(!player.paused && !player.playing) player.pause(false);

            interaction.editReply({
                ephemeral: true,
                content: `Started playing ${response.tracks[0].title} by ${response.tracks[0].author}`
            });
            //if (playlistResponse) return await playlistMessage(client, response.playlist?.name || `No-Playlist-Name`, response.tracks, msg, contentURL ? contentURL : undefined, undefined, player.textChannel !== message.channel.id ? player.textChannel : null)
            //else return await nowPlayingMessage(client, response.tracks[0], msg, player.textChannel !== message.channel.id ? player.textChannel : null);
        } else {
            const skipSong = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "skip";
            const addSongToTop = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "addontop";
            if(!skipSong && !addSongToTop) {
                // Add the Track(s) to END
                if (playlistResponse) player.queue.add(response.tracks)
                else player.queue.add(response.tracks[0]);
            } else {
                // Add the Track(s) to TOP
                if(playlistResponse) player.queue.splice(0, 0, ...response.tracks);
                else player.queue.splice(0, 0, response.tracks[0]);
                if(skipSong) player.stop();
            }

            // edit the response for adding to the queue
            //if (playlistResponse) return await addQueuePlaylistMessage(client, player, response.playlist?.name || `No-Playlist-Name`, response.tracks, msg, contentURL ? contentURL : undefined, undefined, false, player.textChannel !== message.channel.id ? player.textChannel : null)
            //else if(skipSong) return await msg.edit({ content: message.translate("PLAYSKIP", response.tracks[0].title, response.tracks[0].author || "Unknown", player.textChannel !== message.channel.id ? player.textChannel : null) });
            //else return await addQueueMessage(client, player, response.tracks[0], msg, !!addSongToTop, player.textChannel !== message.channel.id ? player.textChannel : null);
        }

    }
}