import { ActionRowBuilder, SelectMenuBuilder } from "@discordjs/builders";
import { TrackUtils } from "erela.js";
import { optionTypes } from "../structures/BotClient.mjs";
import { i18n, inlineLocale, inlineLocalization } from "../structures/i18n.mjs";

/** @type
/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "charts",
    description: inlineLocale("EnglishUS", `charts.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "charts", "charts.description")),
    options: [
        {
            name: "limit",
            description: inlineLocale("EnglishUS", `charts.options.limit`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "limit", "charts.options.limit")),
            required: false,
            type: optionTypes.number,
            max: 200,
            min: 10,
        },
        {
            name: "queueaction",
            description: inlineLocale("EnglishUS", `play.options.queueaction`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "queueaction", "play.options.queueaction")),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {name: "skip", value: "skip" },
                {name: "addontop", value: "addontop" },
            ]
        }, 
        {
            name: "query_search_filter",
            description: inlineLocale("EnglishUS", `charts.options.query_search_filter`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "query_search_filter", "charts.options.query_search_filter")),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {name: "tracks", value: "tracks" },
                {name: "artists", value: "artists" },
                {name: "albums", value: "albums" },
                {name: "playlists", value: "playlists" },
                {name: "podcasts", value: "podcasts" },
            ]
        }
    ],
    /** @param {import("../structures/BotClient.mjs").BotClient} client */
    async execute(client, interaction) {
        const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(interaction, interaction.member);
        if(!player) return;

        const searchFilter = interaction.options.getString("query_search_filter");
        
        const limit = interaction.options.getNumber("limit") && isNaN(interaction.options.getNumber("limit")) ? Number(interaction.options.getNumber("limit")) : 100;
        await interaction.reply({
            ephemeral: true,
            content: `Now searching the charts${searchFilter ? `for \`${searchFilter}\`` : ``}`
        });
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
        let searchingTracks = [];
        const handleResSearchFilter = async (res, type) => {
            const sorted = res?.data?.filter?.(x => x.public === true || typeof x.public  === "undefined")?.sort?.((a,b ) => {
                if(a.type === "artist") {
                    return b.nb_fan - a.nb_fan;
                } else if(a.type == "playlist") {
                    return b.nb_tracks - a.nb_tracks;
                } else return 0;
            });
            if(!sorted?.length) return interaction.editReply({
                ephemeral: true,
                content: `❌ Nothing found for the Charts`.substring(0, 1000)
            })
            await interaction.editReply({
                components: [
                    new ActionRowBuilder().addComponents([
                        new SelectMenuBuilder()
                            .setCustomId(`${interaction.user.id}_${type}pick`)
                            .setPlaceholder(`Select your Wished ${type.substring(0, 1).toUpperCase() + type.substring(1, type.length)}`)
                            .addOptions(sorted.map(v => {
                                const o = {
                                    label: `${v.title || v.name}`, 
                                    value: `${v.id}`, 
                                    // description: `${v.title} Radio Station`, 
                                    // default, 
                                    // emoji
                                }
                                if(v.description?.length) o.description = v.description.substring(0, 100);
                                else if(v.nb_fan) o.description = `${client.DeezUtils.number.dotter(v.nb_fan)} Fans with ${client.DeezUtils.number.dotter(v.nb_album)} Albums`;
                                else if(v.nb_tracks) o.description = `${client.DeezUtils.number.dotter(v.nb_tracks)} Tracks${v.user?.name ? ` by ${v.user?.name}` : v.artist?.name ? ` by ${v.artist.name}` : ``}${v.creation_date ? ` - ${v.creation_date}` : ``}`
                                return o;
                            }).slice(0, 25))
                    ])
                ]
            });
            const collector = interaction.channel.createMessageComponentCollector({
                max: 1,
                time: 60000,
                filter: (m => m.user.id === interaction.user.id && m.customId === `${interaction.user.id}_${type}pick`)
            });
            collector.on("collect", async i => {
                const id = i.values[0];
                await i.update({
                    content: `Picked the **${type.substring(0, 1).toUpperCase() + type.substring(1, type.length)}**`,
                    components: []
                });
                const data = await client.DeezApi.deezer.fetch[type](id, true);
                if(data.tracks.length) {
                    i.editReply({
                        content: `Found the **${type.substring(0, 1).toUpperCase() + type.substring(1, type.length)}**: \`${data.title || data.name}\` with \`${data.tracks.length} Tracks\`\n> ${data.link || data.share}`,
                        components: [],
                    });
                    
                    const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(i || interaction, interaction.member);
                    if(!player) return;
                    
                    const responsedTracks = data.tracks.filter(v => typeof v.readable === "undefined" || v.readable == true).map(v => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v), interaction.user));
                    if (created || previousQueue === 0) {
                        player.queue.add(responsedTracks);
                        player.play({
                            pause: false,
                            volume: await client.db.guildSettings.findFirst({
                                where: { guildId: interaction.guildId },
                                select: { defaultvolume: true }
                            }).then(x => x?.defaultvolume || 100),
                            startTime: 0,
                        });
                        //if(!player.queue.current.uri && contentURL) player.queue.current.uri = contentURL;
                        if(!player.paused && !player.playing) player.pause(false);
                    } else {
                        const skipSong = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "skip";
                        const addSongToTop = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "addontop";
                        if(!skipSong && !addSongToTop) player.queue.add(responsedTracks)
                        else player.queue.splice(0, 0, ...responsedTracks);
                        if(skipSong) player.stop();
                    }
                } else {
                    i.editReply({
                        content: `Picked the **${type.substring(0, 1).toUpperCase() + type.substring(1, type.length)}**: ${data.link || data.share}, but found 0 Tracks..`,
                        components: [],
                    });
                }
            })
            collector.on("end", (col, reason) => {
                if(["messageDelete", "channelDelete", "threadDelete", "guildDelete", "limit", "REACHED_ANTI_SPAM_LIMIT"].map(x => x.toLowerCase()).includes(reason?.toLowerCase())) return;
                if(!col.size) {
                    interaction.editReply({
                        components: [],
                        content: `Time ran out`
                    })
                }
            })
        }

        if(searchFilter && searchFilter === "tracks") {
            searchingTracks = { tracks: await client.DeezApi.deezer.charts.tracks(limit).then(x => {
                return (x?.data || []).filter(v => typeof v.readable === "undefined" || v.readable == true).map(v => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v), interaction.user))       
            })};
        }
        else if(searchFilter) {
            const res = await client.DeezApi.deezer.charts[searchFilter](limit);
            return handleResSearchFilter(res, searchFilter)
        }
        else {
            // search all ?
            searchingTracks = { tracks: await client.DeezApi.deezer.charts.tracks(limit).then(x => {
                return (x?.data || []).filter(v => typeof v.readable === "undefined" || v.readable == true).map(v => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v), interaction.user))       
            })};
        }

        const response = searchingTracks ? { data: searchingTracks, loadType: `TRACKS_LOADED`, tracks: searchingTracks?.tracks || searchingTracks } : null;
        if(!response.tracks?.length) return interaction.editReply({
            ephemeral: true,
            content: `❌ No Tracks found`
        });
        const loadAllTracks = [`PLAYLIST_LOADED`, `ARTIST_LOADED`, `ALBUM_LOADED`, `RADIO_LOADED`].includes(response.loadType);
        // if a player was created, or the previous queue was empty, or there was no player before
        if (created || previousQueue === 0) {
            // Add the Track(s)
            if (loadAllTracks) player.queue.add(response.tracks)
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
            //if(!player.queue.current.uri && contentURL) player.queue.current.uri = contentURL;
            if(!player.paused && !player.playing) player.pause(false);

            interaction.editReply({
                ephemeral: true,
                content: `Found the Track: \`${response.tracks[0].title}\` by \`${response.tracks[0].author}\``
            });
            //if (loadAllTracks) return await playlistMessage(client, response.playlist?.name || `No-Playlist-Name`, response.tracks, msg, contentURL ? contentURL : undefined, undefined, player.textChannel !== message.channel.id ? player.textChannel : null)
            //else return await nowPlayingMessage(client, response.tracks[0], msg, player.textChannel !== message.channel.id ? player.textChannel : null);
        } else {
            const skipSong = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "skip";
            const addSongToTop = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "addontop";
            if(!skipSong && !addSongToTop) {
                // Add the Track(s) to END
                if (loadAllTracks) player.queue.add(response.tracks)
                else player.queue.add(response.tracks[0]);
            } else {
                // Add the Track(s) to TOP
                if(loadAllTracks) player.queue.splice(0, 0, ...response.tracks);
                else player.queue.splice(0, 0, response.tracks[0]);
                if(skipSong) player.stop();
            }
        }
    }
}