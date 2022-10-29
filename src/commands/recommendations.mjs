import { ActionRowBuilder, SelectMenuBuilder } from "@discordjs/builders";
import { TrackUtils } from "erela.js";
import { optionTypes } from "../structures/BotClient.mjs";
import { i18n, inlineChoicesLocale, inlineLocale, inlineLocalization } from "../structures/i18n.mjs";
import { ButtonBuilder, ButtonStyle, parseEmoji, Utils } from "discord.js";
import { handleResSearchFilter } from "./play.mjs";

const fetchKeysForRecommendations = {
    releases: "album",
    mixes: "mix",
    albums: "album",
    playlists: "playlist",
    artists: "artist",
    tracks: "track",
}

const errorCatcher = (e) => { console.warn(e); return null; };

/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "recommendations",
    category: "music#request#player",
    description: inlineLocale("EnglishUS", `musicrequest.recommendations.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "recommendations", "musicrequest.recommendations.description")),
    options: [
        {
            name: "queueaction",
            description: inlineLocale("EnglishUS", `musicrequest.play.options.queueaction`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "queueaction", "musicrequest.play.options.queueaction")),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {
                    name: "Skip",
                    name_localizations: inlineChoicesLocale("general.words.Skip"), 
                    value: "skip"
                },
                {
                    name: "Add on Top",
                    name_localizations: inlineChoicesLocale("general.phrases.addontop"), 
                    value: "addontop"
                },
            ]
        }, 
        {
            name: "pick_searchresult",
            description: inlineLocale("EnglishUS", `musicrequest.play.options.pick_searchresult`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "pick_searchresult", "musicrequest.play.options.pick_searchresult")),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {
                    name: "Yes", 
                    name_localizations: inlineChoicesLocale("general.words.yes"),
                    value: "true"
                },
                {
                    name: "No", 
                    name_localizations: inlineChoicesLocale("general.words.no"),
                    value: "false"
                },
            ]
        }, 
        {
            name: "query_search_filter",
            description: inlineLocale("EnglishUS", `musicrequest.play.options.query_search_filter`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "query_search_filter", "musicrequest.play.options.query_search_filter")),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {
                    name: "Tracks", 
                    name_localizations: inlineChoicesLocale("general.words.Tracks"),
                    value: "tracks" 
                },
                {
                    name: "Artists", 
                    name_localizations: inlineChoicesLocale("general.words.Artists"),
                    value: "artists" 
                },
                {
                    name: "Playlists", 
                    name_localizations: inlineChoicesLocale("general.words.Playlists"),
                    value: "playlists" 
                },
                {
                    name: "Albums", 
                    name_localizations: inlineChoicesLocale("general.words.Albums"),
                    value: "albums" 
                },
                {
                    name: "Genre Mixes", 
                    name_localizations: inlineChoicesLocale("general.words.GenreMixes"),
                    value: "mixes" 
                },
                {
                    name: "Released Albums",
                    name_localizations: inlineChoicesLocale("general.words.ReleasedAlbums"),
                    value: "releases" 
                },
            ]
        },
    ],
    async execute(client, interaction) {
        const { deezerToken: accessToken, deezerId } = await client.db.userData.findFirst({
            where: { userId : interaction.user.id }, select: { deezerToken: true, deezerId: true }
        }).catch(() => {}) || {};

        if(!accessToken || !deezerId) {
            return await interaction.reply({
                ephemeral: true,
                content: inlineLocale(interaction.guildLocale, "general.errors.usernotloggedin", {
                    user: `<@${interaction.user.id}>`,
                    command: client.commands.find(c => c.name == "login")?.mention || "\`/account login\`",
                })
            })
        }
        if(accessToken) interaction.user.accessToken = accessToken; 
        if(deezerId) interaction.user.deezerId = deezerId;

        
        const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(interaction, interaction.member, true);
        if(!player) return;

        const skipSong = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "skip";
        const addSongToTop = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "addontop";
        const searchFilter = interaction.options.getString("query_search_filter")?.replace?.("genre_mix", "mixes/genre");
        const pickSearchResult = interaction.options.getString("pick_searchresult") && interaction.options.getString("pick_searchresult") === "true"

        await interaction.reply({
            ephemeral: true,
            content: inlineLocale(interaction.guildLocale, `musicrequest.recommendations.execute.searching`)
        });
              
        let searchingTracks = null;
        let loadType = "TRACKS_FOUND";

        const measureTimer = new client.DeezUtils.time.measureTime();
        if(searchFilter && searchFilter !== "tracks") { // search something, but not a track
            const res = await client.DeezApi.user.recommendations[searchFilter](deezerId, accessToken, 50)
            // end the timer
            measureTimer.end();
            // return the util function
            return handleResSearchFilter(client, interaction, res, fetchKeysForRecommendations[searchFilter], skipSong, addSongToTop, accessToken)
        } else { // else search for a track
            searchingTracks = await client.DeezApi.user.recommendations.tracks(deezerId, accessToken, 50).then(x => {
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
                content: inlineLocale(interaction.guildLocale, `general.errors.notplayable`, {
                    title: searchingTracks.tracks[0]?.title || searchingTracks.data?.title,
                    link: searchingTracks.tracks[0]?.uri || searchingTracks.data?.link,
                })
             })
        }

        const response = searchingTracks ? { data: searchingTracks, loadType, tracks: searchingTracks?.tracks || searchingTracks } : await client.DeezCord.search(query, interaction.user, player.node);
        if(!response.tracks?.length) return interaction.editReply({ 
            ephemeral: true, 
            content: inlineLocale(interaction.guildLocale, `general.errors.notracksfound`)
        });
        let pick = false;
        const fetchTime = measureTimer.end();
        if(loadType == "TRACKS_FOUND" && pickSearchResult) {
            const msg = await interaction.editReply({
                content: inlineLocale(interaction.guildLocale, `musicrequest.play.execute.pickwishedsong`),
                components: [
                    new ActionRowBuilder().addComponents([
                        new SelectMenuBuilder()
                        .setCustomId(`${interaction.user.id}_searchpick`)
                        .setPlaceholder(inlineLocale(interaction.guildLocale, `musicrequest.play.execute.selectsong`))
                        .addOptions(client.DeezUtils.array.removeDuplicates(response.tracks, "identifier").slice(0, 25).map(v => {
                            return {
                                label: `${v.title || v.name}`.substring(0, 100), 
                                value: `${v.identifier}`.substring(0, 100), 
                                description: `[${client.DeezUtils.time.durationFormatted(v.duration, true)}] | By: ${v.author} | Rank #${v.rank}`.substring(0, 100), 
                            }
                        }))
                    ]),
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel(inlineLocale(interaction.guildLocale, `musicrequest.play.execute.cancelbutton`)).setCustomId("cancel")
                    ])
                ],
            });
            pick = await new Promise((r) => {
                const col = msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id, max: 1, time: 60000 });
                col.on("collect", async (i) => {
                    if(i.customId === "cancel") {
                        await i.update({ content: inlineLocale(interaction.guildLocale, `general.phrases.requestCanceled`), components: [] }).catch(() => null);
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