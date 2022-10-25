import { ActionRowBuilder, SelectMenuBuilder } from "@discordjs/builders";
import { TrackUtils } from "erela.js";
import { optionTypes } from "../structures/BotClient.mjs";
import { i18n, inlineLocale, inlineLocalization } from "../structures/i18n.mjs";
import { Embed } from "../structures/Embed.mjs";

const loadTypes = {
    "artist": "ARTIST_LOADED",
    "playlist": "PLAYLIST_LOADED",
    "album": "ALBUM_LOADED",
    "radio": "RADIO_LOADED"
}
const searchFilterMethods = {
    "artist": "artists",
    "playlist": "playlists",
    "album": "albums",
    "radio": "radios"
}
/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "play",
    description: inlineLocale("EnglishUS", `play.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "play", "play.description")),
    options: [
        {
            name: "query",
            description: inlineLocale("EnglishUS", `play.options.query`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "query", "play.options.query")),
            required: true,
            type: optionTypes.string,
            // autocomplete: true,
        },
        {
            name: "file",
            description: inlineLocale("EnglishUS", `play.options.file`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "file", "play.options.file")),
            required: false,
            type: optionTypes.attachment,
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
            description: inlineLocale("EnglishUS", `play.options.query_search_filter`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "query_search_filter", "play.options.query_search_filter")),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {name: "track", value: "track" },
                {name: "artist", value: "artist" },
                {name: "playlist", value: "playlist" },
                {name: "album", value: "album" },
                {name: "radio", value: "radio" },
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
            });
        */
        const query = interaction.options.getString("query");
        await interaction.reply({
            ephemeral: true,
            content: `Now searching for: ${query}`
        });
        const finishFetcher = x => {
            const data = { ...x };
            data.tracks = (x?.tracks?.data||x?.tracks||[]).filter(v => typeof v.readable === "undefined" || v.readable == true).map(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user));
            return data;
        }
        // if(link) extractId and search for right query
        let searchingTracks = null;
        let loadType = "TRACKS_FOUND";

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
                content: `❌ Nothing found for the RadioStation: \`${query}\``.substring(0, 1000)
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
                    const responsedTracks = data.tracks.filter(v => typeof v.readable === "undefined" || v.readable == true).map(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user));
                    if(type === "playlist") {
                        const plName = data?.name || data?.title || "No-Title";
                        const plLink = data?.link || "https://deezer.com";
                        const plAuthorData = response.playlist?.authorData || await client.fetchAuthorData(data?.artist || responsedTracks?.filter?.(v => v?.authorData)?.[0]?.authorData);
                        interaction.editReply({
                            ephemeral: true,
                            embeds: [
                                new Embed().setAuthor({
                                    name: plAuthorData?.name ? `${plAuthorData?.name} - © Deezcord` : `© Deezcord`,
                                    iconURL: plAuthorData?.image ? `${plAuthorData?.image}` : "https://cdn.discordapp.com/avatars/1032998523123290182/83b2c200dbc11dd5e0a96dc83d600b17.webp?size=256",
                                    url: plAuthorData?.link ? `${plAuthorData?.link}` : "https://cdn.discordapp.com/avatars/1032998523123290182/83b2c200dbc11dd5e0a96dc83d600b17.webp?size=256"
                                })
                                .setTitle(`📑 Playlist Loaded: **${plName}**`)
                                .addField(`Tracks-Amount:`, `> \`${responsedTracks.length} Tracks\``)
                            ],
                            components: [
                                new ActionRowBuilder().addComponents([
                                    new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("PL-Link").setURL(plLink)
                                ])
                            ]
                        })
                    } else {
                        i.editReply({
                            content: `Found the **${type.substring(0, 1).toUpperCase() + type.substring(1, type.length)}**: \`${data.title || data.name}\` with \`${data.tracks.length} Tracks\`\n> ${data.link || data.share}`,
                            components: [],
                        });
                    }
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

        // fetch urls
        if(query.match(client.DeezRegex)) {
            const [,,,type,id] = query.match(client.DeezRegex);
            if(type === "track") {
                searchingTracks = {
                    tracks: [
                        await client.DeezApi.deezer.fetch.track(id).then(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user)).catch((e) => {console.warn(e); return null;})
                    ]
                };
                if(searchingTracks.tracks?.[0]?.readable === false) {
                    return await interaction.editReply({
                        content: `❌ Found Track: ${searchingTracks.tracks[0].link} but it's not playable`
                    })
                }
            } else if(loadTypes[type]) { // https://api.deezer.com/playlist/8282573142
                loadType = loadTypes[type];
                searchingTracks = await client.DeezApi.deezer.fetch[type](id, true).then(finishFetcher).catch((e) => {console.warn(e); return null;});
            } else {
                searchingTracks = null;
            }
        }
        // else search
        else {
            const searchFilter = interaction.options.getString("query_search_filter");
            if(searchFilter && searchFilter === "track") {
                searchingTracks = { tracks: await client.DeezApi.deezer.search.tracks(query).then(x => {
                    return (x?.data || []).filter(v => typeof v.readable === "undefined" || v.readable == true).map(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user))       
                })};
            }
            else if(searchFilter && searchFilterMethods[searchFilter]) {
                const res = await client.DeezApi.deezer.search[`${searchFilterMethods[searchFilter]}`](query);
                return handleResSearchFilter(res, searchFilter)
            }
            else {
                // search all ?
                searchingTracks = { tracks: await client.DeezApi.deezer.search.tracks(query).then(x => {
                    return (x?.data || []).filter(v => typeof v.readable === "undefined" || v.readable == true).map(v => TrackUtils.buildUnresolved(client.createUnresolvedData(v), interaction.user))       
                })};
            }
        }
        const response = searchingTracks ? { data: searchingTracks, loadType, tracks: searchingTracks?.tracks || searchingTracks } : await client.DeezCord.search(query, interaction.user, player.node);
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

            if(response.loadType = "PLAYLIST_LOADED") {
                const plName = response.playlist?.name || response.data?.name || response.data?.title || "No-Title";
                const plLink = response.playlist?.uri || response.data?.link || "https://deezer.com";
                const plAuthorData = response.playlist?.authorData || await client.fetchAuthorData(response.data?.artist || response?.tracks?.filter?.(v => v?.authorData)?.[0]?.authorData);
                interaction.editReply({
                    ephemeral: true,
                    embeds: [
                        new Embed().setAuthor({
                            name: plAuthorData?.name ? `${plAuthorData?.name} - © Deezcord` : `© Deezcord`,
                            iconURL: plAuthorData?.image ? `${plAuthorData?.image}` : "https://cdn.discordapp.com/avatars/1032998523123290182/83b2c200dbc11dd5e0a96dc83d600b17.webp?size=256",
                            url: plAuthorData?.link ? `${plAuthorData?.link}` : "https://cdn.discordapp.com/avatars/1032998523123290182/83b2c200dbc11dd5e0a96dc83d600b17.webp?size=256"
                        })
                        .setTitle(`📑 Playlist Loaded: **${plName}**`)
                        .addField(`Tracks-Amount:`, `> \`${response.tracks.length} Tracks\``)
                    ],
                    components: [
                        new ActionRowBuilder().addComponents([
                            new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("PL-Link").setURL(plLink)
                        ])
                    ]
                })
            } else if(response.loadType = "ARTIST_LOADED")  {
                interaction.editReply({
                    ephemeral: true,
                    content: `${response.loadType}`
                })
            } else if(response.loadType = "ALBUM_LOADED")  {
                interaction.editReply({
                    ephemeral: true,
                    content: `${response.loadType}`
                })
            } else if(response.loadType = "RADIO_LOADED")  {
                interaction.editReply({
                    ephemeral: true,
                    content: `${response.loadType}`
                })
            } else {
                interaction.editReply({
                    ephemeral: true,
                    content: `Found the Track: \`${response.tracks[0].title}\` by \`${response.tracks[0].author}\``
                });
            }
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