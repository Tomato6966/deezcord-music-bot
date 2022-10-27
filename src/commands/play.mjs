import { ActionRowBuilder, SelectMenuBuilder } from "@discordjs/builders";
import { TrackUtils } from "erela.js";
import { optionTypes } from "../structures/BotClient.mjs";
import { i18n, inlineLocale, inlineLocalization } from "../structures/i18n.mjs";
import { Embed } from "../structures/Embed.mjs";
import { ButtonBuilder, ButtonStyle, parseEmoji, Utils } from "discord.js";
import fetch from "node-fetch";

const loadTypes = {
    "artist": "ARTIST_LOADED",
    "playlist": "PLAYLIST_LOADED",
    "album": "ALBUM_LOADED",
    "radio": "MIXES_LOADED",
    "mixes/genre": "MIXES_LOADED",
}
const searchFilterMethods = {
    "artist": "artists",
    "playlist": "playlists",
    "album": "albums",
    "radio": "mixes", // "mixes"
    "mixes/genre": "mixes",
}

const errorCatcher = (e) => { console.warn(e); return null; };

/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "play",
    category: "music#request#player",
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
            name: "pick_searchresult",
            description: inlineLocale("EnglishUS", `play.options.pick_searchresult`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "pick_searchresult", "play.options.pick_searchresult")),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {name: "True", value: "true" },
                {name: "False", value: "false" },
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
                {name: "genre_mix", value: "genre_mix" },
            ]
        }
    ],
    async execute(client, interaction) {      
        /*
            const login = client.db.userData.findFirst({
                where: { userId: interaction.user.id },
                select: {
                    deezerId: true, deezerToken: true
                }
            });
            if(!login || !login.deezerToken) return interaction.reply({
                ephemeral: true,
                content: `${client.DeezEmojis.deny.str} You have to be logged in to Deezer, do it with: ${client.commands.get("login")?.mention || "`/login`"}`
            });
        */
        const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(interaction, interaction.member, true);
        if(!player) return;

        let query = interaction.options.getString("query");
        const skipSong = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "skip";
        const addSongToTop = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "addontop";
        const searchFilter = interaction.options.getString("query_search_filter")?.replace?.("genre_mix", "mixes/genre");
        const pickSearchResult = interaction.options.getString("pick_searchresult") && interaction.options.getString("pick_searchresult") === "true"

        const { deezerToken: accessToken, deezerId } = await client.db.userData.findFirst({
            where: { userId : interaction.user.id }, select: { deezerToken: true, deezerId: true }
        }).catch(() => {}) || {};

        if(accessToken) interaction.user.accessToken = accessToken; 
        if(deezerId) interaction.user.deezerId = deezerId; 

        await interaction.reply({
            ephemeral: true,
            content: inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.searchingquery`, {
                query: (client.DeezRegex.test(query) ? `<${query}>` : query)
            })
        });
              
        let searchingTracks = null;
        let loadType = "TRACKS_FOUND";

        const measureTimer = new client.DeezUtils.time.measureTime();

        if(query.match(client.DeezRegex) && query.includes("page.link")) {
            query = await fetch(query, { redirect: 'manual', follow: 0 }).then(x => x.headers.get("location").split("?utm_campaign=")[0]).catch(v => query);
        }
        const [ ,,,URL_Type,URL_Id ] = query.match(client.DeezRegex) || [];

        if(URL_Id && URL_Type && URL_Type === "track") { // fetch if from URL
            searchingTracks = await client.DeezApi.deezer.fetch.track(URL_Id, accessToken).then(v => {
                return { data: v, tracks: [TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v, v?.playlist, v?.album), interaction.user)], }
            }).catch(errorCatcher); 
            // set the loadtype
            loadType = "TRACKS_FOUND";
        } else if(URL_Id && URL_Type && loadTypes[URL_Type]) { // fetch if from URL (playlist, artist, album, mixes)
            searchingTracks = await client.DeezApi.deezer.fetch[URL_Type == "mixes/genre" ? "mix" : URL_Type](URL_Id, true, accessToken).then(v => finishFetcher(client, v, URL_Type, interaction.user)).catch(errorCatcher);
            loadType = loadTypes[URL_Type];
        } else if((URL_Id && URL_Type) || client.UrlRegex.test(query)) { // url is matched, but it's not a valid searchingtype
            return interaction.editReply({
                content: inlineLocale(client.getGuildLocale(interaction.guild), `general.errors.notvalidurl`, {
                    query: client.UrlRegex.test(query) ? `<${query}>` : `${query}`,
                })
            })
        } else if(searchFilter && searchFilterMethods[searchFilter] && searchFilter !== "track") { // search something, but not a track
            const res = await client.DeezApi.deezer.search[`${searchFilterMethods[searchFilter]}`](query, 25, accessToken);
            // end the timer
            measureTimer.end();
            // return the util function
            return handleResSearchFilter(client, interaction, res, searchFilter, skipSong, addSongToTop, accessToken)
        } else { // else search for a track
            searchingTracks = await client.DeezApi.deezer.search.tracks(query, 25, accessToken).then(x => {
                return { data: x, tracks: (x?.data || [])
                    .filter(v => typeof v.readable === "undefined" || v.readable == true)
                    .map(v => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v, v?.playlist, v?.album), interaction.user))
                };
            }).catch(errorCatcher); 
            // set the loadtype
            loadType = "TRACKS_FOUND";
        }

        // if song is not readable
        if(searchingTracks?.tracks?.[0]?.readable === false || searchingTracks.data?.readable === false) {
            return await interaction.editReply({ 
                content: inlineLocale(client.getGuildLocale(interaction.guild), `general.errors.notplayable`, {
                    title: searchingTracks.tracks[0]?.title || searchingTracks.data?.title,
                    link: searchingTracks.tracks[0]?.uri || searchingTracks.data?.link,
                })
             })
        }

        const response = searchingTracks ? { data: searchingTracks, loadType, tracks: searchingTracks?.tracks || searchingTracks } : await client.DeezCord.search(query, interaction.user, player.node);
        if(!response.tracks?.length) return interaction.editReply({ 
            ephemeral: true, 
            content: inlineLocale(client.getGuildLocale(interaction.guild), `general.errors.notracksfound`)
        });
        let pick = false;
        const fetchTime = measureTimer.end();
        if(loadType == "TRACKS_FOUND" && pickSearchResult) {
            const msg = await interaction.editReply({
                content: inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.pickwishedsong`),
                components: [
                    new ActionRowBuilder().addComponents([
                        new SelectMenuBuilder()
                        .setCustomId(`${interaction.user.id}_searchpick`)
                        .setPlaceholder(inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.selectsong`))
                        .addOptions(client.DeezUtils.array.removeDuplicates(response.tracks, "identifier").slice(0, 25).map(v => {
                            return {
                                label: `${v.title || v.name}`.substring(0, 100), 
                                value: `${v.identifier}`.substring(0, 100), 
                                description: `[${client.DeezUtils.time.durationFormatted(v.duration, true)}] | By: ${v.author} | Rank #${v.rank}`.substring(0, 100), 
                            }
                        }))
                    ]),
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel(inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.cancelbutton`)).setCustomId("cancel")
                    ])
                ],
            });
            pick = await new Promise((r) => {
                const col = msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id, max: 1, time: 60000 });
                col.on("collect", async (i) => {
                    if(i.customId === "cancel") {
                        await i.update({ content: inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.cancelledresponse`), components: [] }).catch(() => null);
                        return r(false);
                    } 
                    return r({ interaction: i, track: i.values[0] });
                }) 
                col.on("end", (col) => { if(!col.size) return r(false); })
            });
            if(!pick) return
        }

        const pickedTrack = pick?.track ? response.tracks.find(x => x.identifier == pick.track) : undefined;
        if(pickedTrack) {
            if(Array.isArray(response?.data?.data?.data) && response.data.data.data.find(x => x.id == pickedTrack.identifier)) response.data.data.data = [response.data.data.data.find(x => x.id == pickedTrack.identifier)];
            else if(Array.isArray(response?.data?.data) && response.data.data.find(x => x.id == pickedTrack.identifier)) response.data.data = [response.data.data.find(x => x.id == pickedTrack.identifier)];
            else if(Array.isArray(response?.data) && response.data.find(x => x.id == pickedTrack.identifier)) response.data = [response.data.find(x => x.id == pickedTrack.identifier)];
            response.tracks = [pickedTrack]
            interaction.editReply = (...params) => pick.interaction.update(...params);
        }


        const loadAllTracks = [`PLAYLIST_LOADED`, `ARTIST_LOADED`, `ALBUM_LOADED`, `RADIO_LOADED`, `MIXES_LOADED`].includes(response.loadType);
        // if a player was created, or the previous queue was empty, or there was no player before
        if (created || previousQueue === 0) {
            // add fetchTime, only if song is the next song
            if((!player.paused && !player.playing) || (!player.paused && player.playing)) response.tracks[0].fetchTime = fetchTime;
            // Add the Track(s)
            if (loadAllTracks) player.queue.add(response.tracks)
            else player.queue.add(response.tracks[0]);
            // Play the song with default options
            player.play({
                pause: false,
                volume: await client.db.guildSettings.findFirst({
                    where: { guildId: interaction.guildId },
                    select: { defaultvolume: true }
                }).then(x => x?.defaultvolume || client.configData.defaultVolume),
                startTime: 0,
            });
            if(!player.paused && !player.playing) player.pause(false);

            return await interaction.editReply({...(await client.DeezUtils.track.transformMessageData(response.data, response.tracks || [], response.loadType, false, player))}).catch(console.warn);
        } else {
            // add fetchTime, only if song is the next song
            if(skipSong) response.tracks[0].fetchTime = fetchTime;

            if(!skipSong && !addSongToTop) player.queue.add((loadAllTracks ? response.tracks : [response.tracks[0]]))
            else player.queue.splice(0, 0, ...(loadAllTracks ? response.tracks : [response.tracks[0]]));
            if(skipSong) player.stop();

            return await interaction.editReply({...(await client.DeezUtils.track.transformMessageData(response.data, response.tracks || [], response.loadType, true, player, { skipSong, addSongToTop }))}).catch(console.warn);
        }
    }
}


export function finishFetcher(client, x, type, user) {
    const data = { ...x };
    const playlistData = String(type).toLowerCase?.().startsWith?.("playlist") ? client.DeezUtils.track.createPlaylistData(x) : undefined;
    const albumData = String(type).toLowerCase?.().startsWith?.("album") || x.album ? client.DeezUtils.track.createAlbumData(x) : undefined;
    data.tracks = (x?.tracks?.data||x?.tracks||x?.data||[])
        .filter(v => typeof v.readable === "undefined" || v.readable == true)
        .map(v => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v, playlistData, albumData || v?.album), user));
    return data;
}

export async function handleResSearchFilter(client, interaction, res, type, skipSong, addSongToTop, accessToken) {
    const sorted = res?.data?.filter?.(x => x.public === true || typeof x.public === "undefined")?.sort?.((a,b) => {
        if(a?.type === "artist" || b?.type === "artist") {
            return b.nb_fan - a.nb_fan;
        } else if(a?.type == "playlist" || b?.type == "playlist") {
            return b.nb_tracks - a.nb_tracks;
        } else if(a?.type == "mixes/genre" || a?.type == "radio" || b?.type == "mixes/genre" || b?.type == "radio"){
            const name1 = (a.title || a.name || "")
            const name2 = (b.title || b.name || "")
            return name1.localeCompare(name2)
        } else return 0;
    });

    if(!sorted?.length) return interaction.editReply({
        ephemeral: true,
        content: inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.nothingfound`, {
            crossEmoji: client.DeezEmojis.error.str,
            type: type.substring(0, 1).toUpperCase() + type.substring(1, type.length),
            query: query
        }).substring(0, 1000)
    })

    await interaction.editReply({
        components: [
            new ActionRowBuilder().addComponents([
                new SelectMenuBuilder()
                    .setCustomId(`${interaction.user.id}_${type}pick`)
                    .setPlaceholder(inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.selectwishedtype`, { type: type.substring(0, 1).toUpperCase() + type.substring(1, type.length) }))
                    .addOptions(sorted.map(v => {
                        const o = {
                            label: `${v.title || v.name}`, 
                            value: `${v.id}`, 
                        }
                        if((type == "radio" || type == "mixes/genre") && v.description?.length) o.description = inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.mapmix`, {
                            desc: v.description
                        }).substring(0, 100);
                        else if(v.description?.length) o.description = v.description.substring(0, 100);
                        else if(v.nb_fan) o.description = inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.mapfans`, {
                            fans: client.DeezUtils.number.dotter(v.nb_fan),
                            albums: client.DeezUtils.number.dotter(v.nb_album),
                        });
                        else if(v.nb_tracks) o.description = (inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.maptracks`, {
                            tracks: client.DeezUtils.number.dotter(v.nb_tracks),
                            name: v.user?.name ? `${v.user?.name}` : v.artist?.name ? `${v.artist.name}` : `Unknown`
                        }) + ` ${v.creation_date ? ` - ${v.creation_date}` : ``}`)
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
            content: inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.pickedtype`, {
                type: type.substring(0, 1).toUpperCase() + type.substring(1, type.length),
            }),
            components: []
        });
        const measureTimer = new client.DeezUtils.time.measureTime();

        const data = await client.DeezApi.deezer.fetch[type == "mixes/genre" ? "mix" : type](id, true, accessToken);
        if(data.tracks.length) {
            
            const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(i || interaction, interaction.member);
            if(!player) return;

            const fetchTime = measureTimer.end();

            const responsedTracks = data.tracks
                .filter(v => typeof v.readable === "undefined" || v.readable == true)
                .map(v => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v, v?.playlist, v?.album), interaction.user));
            
            if (created || previousQueue === 0) {
                if((!player.paused && !player.playing) || (!player.paused && player.playing)) responsedTracks[0].fetchTime = fetchTime;

                player.queue.add(responsedTracks);
                player.play({
                    pause: false,
                    volume: await client.db.guildSettings.findFirst({
                        where: { guildId: interaction.guildId },
                        select: { defaultvolume: true }
                    }).then(x => x?.defaultvolume || client.configData.defaultVolume),
                    startTime: 0,
                });
                //if(!player.queue.current.uri && contentURL) player.queue.current.uri = contentURL;
                if(!player.paused && !player.playing) player.pause(false);
                
                return await i.editReply({...(await client.DeezUtils.track.transformMessageData(data, responsedTracks, type, false, player))}).catch(console.warn);

            } else {
                if(skipSong) responsedTracks[0].fetchTime = fetchTime;

                if(!skipSong && !addSongToTop) player.queue.add(responsedTracks)
                else player.queue.splice(0, 0, ...responsedTracks);
                if(skipSong) player.stop();

                return await interaction.editReply({...(await client.DeezUtils.track.transformMessageData(data, responsedTracks, type, true, player, { skipSong, addSongToTop }))}).catch(console.warn);
            }
        } else {
            i.editReply({
                content: inlineLocale(client.getGuildLocale(interaction.guild), `play.execute.pickedtypefoundnothing`, {
                    type: type.substring(0, 1).toUpperCase() + type.substring(1, type.length),
                    link: data.link || data.share,
                }),
                components: [],
            });
        }
    })
    collector.on("end", (col, reason) => {
        if(["messageDelete", "channelDelete", "threadDelete", "guildDelete", "limit", "REACHED_ANTI_SPAM_LIMIT"].map(x => x.toLowerCase()).includes(reason?.toLowerCase())) return;
        if(!col.size) {
            interaction.editReply({
                components: [],
                content: inlineLocale(client.getGuildLocale(interaction.guild), "general.errors.timeranout")
            })
        }
    })
}