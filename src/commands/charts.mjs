import { ActionRowBuilder, SelectMenuBuilder } from "@discordjs/builders";
import { ButtonBuilder, ButtonInteraction, ButtonStyle, parseEmoji } from "discord.js";
import { TrackUtils } from "erela.js";
import { topChartsPlaylists } from "../data/ChartPlaylists.mjs";
import { optionTypes } from "../structures/BotClient.mjs";
import { i18n, inlineChoicesLocale, inlineLocale, inlineLocalization } from "../structures/i18n.mjs";
import { finishFetcher, handleResSearchFilter, optionKeyToFetch } from "./play.mjs";

const errorCatcher = (e) => { console.warn(e); return null; };

/** @type
/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "charts",
    category: "music#request#player",
    description: inlineLocale("EnglishUS", `musicrequest.charts.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "charts", "musicrequest.charts.description")),
    options: [
        {
            name: "limit",
            description: inlineLocale("EnglishUS", `musicrequest.charts.options.limit`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "limit", "musicrequest.charts.options.limit")),
            required: false,
            type: optionTypes.number,
            max: 200,
            min: 10,
        },
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
            name: "query_search_filter",
            description: inlineLocale("EnglishUS", `musicrequest.charts.options.query_search_filter`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "query_search_filter", "musicrequest.charts.options.query_search_filter")),
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
                    name: "Podcasts", 
                    name_localizations: inlineChoicesLocale("general.words.Podcasts"),
                    value: "podcasts" 
                },
            ]
        },
        {
            name: "country_playlist",
            description: inlineLocale("EnglishUS", `musicrequest.charts.options.country_playlist`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "country_playlist", "musicrequest.charts.options.country_playlist")),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {name: "Pick Country", value: "true" },
                {name: "Song Catcher", value: "songcatcher" },
                {name: "World Wide", value: "worldwide" },
            ]
        }
    ],
    /** @param {import("../structures/BotClient.mjs").BotClient} client */
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

        if(!client.DeezUtils.track.isDjAllowed(interaction, interaction.member, "charts", player));

        const searchFilter = interaction.options.getString("query_search_filter");
        const limit = interaction.options.getNumber("limit") && isNaN(interaction.options.getNumber("limit")) ? Number(interaction.options.getNumber("limit")) : 100;
        const skipSong = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "skip";
        const addSongToTop = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "addontop";
        const chartCountryPlaylist = interaction.options.getString("country_playlist");
        const takeSpecific = chartCountryPlaylist && chartCountryPlaylist == "true";
        
        const access_token = await client.db.userData.findFirst({
            where: { userId : interaction.user.id }, select: { deezerToken: true }
        }).then(x => x?.deezerToken).catch(() => undefined);

        if(takeSpecific) {
            const options = client.DeezUtils.array.chunks(Object.values(topChartsPlaylists.countries).map(x => {
                return {
                    label: x.name,
                    value: `${client.deezerURLtoID(x.link)}`.replaceAll(" ", ""),
                    description: inlineLocale(interaction.guildLocale, "musicrequest.charts.execute.countryPickerDescription", {
                        country: x.name
                    }),
                    emoji: x.emoji ? parseEmoji(x.emoji) : undefined
                }
            }).sort((a,b) => a.label.localeCompare(b.label)), 25)
            let msg = await interaction.reply({
                ephemeral: true,
                content: inlineLocale(interaction.guildLocale, "musicrequest.charts.execute.pleaseSelectCountry", {
                    country: x.name
                }),
                components: [
                    ...options.map((x, i) => {
                        return new ActionRowBuilder().addComponents(new SelectMenuBuilder().setCustomId("picksongs"+i).setPlaceholder(`Select a Country ${i*25}-${i*25 + x.length}`).setOptions(x))
                    }),
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder().setStyle(ButtonStyle.Primary)
                            .setCustomId(client.deezerURLtoID(topChartsPlaylists.others["World Wide"].link))
                            .setLabel(`${inlineLocale(interaction.guildLocale, "general.words.or")}: ${topChartsPlaylists.others["World Wide"].name}`)
                            .setEmoji(parseEmoji(topChartsPlaylists.others["World Wide"].emoji)),

                        new ButtonBuilder().setStyle(ButtonStyle.Primary)
                            .setCustomId(client.deezerURLtoID(topChartsPlaylists.others["Song Catcher"].link))
                            .setLabel(`${inlineLocale(interaction.guildLocale, "general.words.or")}: ${topChartsPlaylists.others["Song Catcher"].name}`)
                            .setEmoji(parseEmoji(topChartsPlaylists.others["Song Catcher"].emoji)),

                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Danger).setCustomId("cancel")
                            .setLabel(inlineLocale(interaction.guildLocale, "general.words.cancel"))
                    ])
                ].slice(0, 5)
            });
            const pick = await new Promise((r) => {
                const col = msg.createMessageComponentCollector({ filter: x => x.user.id === interaction.user.id, max: 1, time: 60000 });
                col.on("collect", async (i) => {
                    if(i.customId === "cancel") {
                        await i.update({ content: inlineLocale(interaction.guildLocale, "general.phrases.requestCanceled"), components: [] }).catch(() => null);
                        return r(false);
                    } 
                    return r({ interaction: i, track: i.isButton() ? i.customId : i.values[0] });
                }) 
                col.on("end", (col) => { if(!col.size) return r(false); })
            });
            if(!pick) return 

            interaction.editReply = (...params) => pick.interaction.update(...params);
            
            const measureTimer = new client.DeezUtils.time.measureTime();
            const res = await client.DeezApi.deezer.fetch.playlist(pick.track, true, access_token).then(v => finishFetcher(client, v, "playlist", interaction.user)).catch(errorCatcher);
            const data = Object.values(topChartsPlaylists.countries).find(x => x.link.endsWith(pick.track)) || Object.values(topChartsPlaylists.others).find(x => x.link.endsWith(pick.track)) || { link: `https://www.deezer.com/playlist/${track}`, name: "Top Hits" };

            const fetchTime = measureTimer.end();
            return handleChartsPlaylist(client, interaction, res, player, { fetchTime, ...data, created, previousQueue, skipSong, addSongToTop })
        } else if(chartCountryPlaylist && !takeSpecific) {
            const takes = {
                "worldwide": "World Wide",
                "songcatcher": "Song Catcher"
            }
            const data = topChartsPlaylists.others[takes[chartCountryPlaylist]] || topChartsPlaylists.others["World Wide"];
            await interaction.reply({
                ephemeral: true,
                content: inlineLocale(interaction.guildLocale, "musicrequest.charts.execute.searchingForChartTracks", {
                    chartTracksName: data.name
                })
            });
            const measureTimer = new client.DeezUtils.time.measureTime();
            const res = await client.DeezApi.deezer.fetch.playlist(client.deezerURLtoID(data.link), true, access_token).then(v => finishFetcher(client, v, "playlist", interaction.user)).catch(errorCatcher);

            const fetchTime = measureTimer.end();
            return handleChartsPlaylist(client, interaction, res, player, { fetchTime, ...data, created, previousQueue, skipSong, addSongToTop })
        } else {
            await interaction.reply({
                ephemeral: true,
                content: searchFilter ? inlineLocale(interaction.guildLocale, "musicrequest.charts.execute.searchingforchartsgeneral") : inlineLocale(interaction.guildLocale, "musicrequest.charts.execute.searchingforchartsfilter", { query: searchFilter })
            });
        }

        let searchingTracks = [];
        
        const measureTimer = new client.DeezUtils.time.measureTime();


        if(searchFilter && searchFilter === "tracks") {
            searchingTracks = await client.DeezApi.deezer.charts.tracks(limit, access_token).then(x => {
                return { data: x, tracks: (x?.data || []).filter(v => typeof v.readable === "undefined" || v.readable == true).map(v => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v, v?.playlist, v?.album), interaction.user)) , }
            }).catch(errorCatcher); 
        }
        else if(searchFilter) {
            const res = await client.DeezApi.deezer.charts[searchFilter](limit > 25 ? 25 : limit, access_token);
            measureTimer.end();
            return handleResSearchFilter(client, interaction, res, optionKeyToFetch[searchFilter], skipSong, addSongToTop)
        }
        else { // search all ?
            searchingTracks = await client.DeezApi.deezer.charts.tracks(limit, access_token).then(x => {
                return { data: x, tracks: (x?.data || [])
                    .filter(v => typeof v.readable === "undefined" || v.readable == true)
                    .map(v => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v, v?.playlist, v?.album), interaction.user)) , }
            }).catch(errorCatcher);
        }
        const fetchTime = measureTimer.end();

        const response = searchingTracks ? { data: searchingTracks, loadType: `CHARTS_LOADED`, tracks: searchingTracks?.tracks || searchingTracks } : null;
        if(!response?.tracks?.length) return interaction.editReply({
            ephemeral: true,
            content: inlineLocale(interaction.guildLocale, "general.errors.notracksfound")
        });

        // if a player was created, or the previous queue was empty, or there was no player before
        if (created || previousQueue === 0) {
            // add fetchTime, only if song is the next song
            if((!player.paused && !player.playing) || (!player.paused && player.playing)) response.tracks[0].fetchTime = fetchTime;
            // Add the Track(s)
            player.queue.add(response.tracks)
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
            
            return await interaction.editReply({...(await client.DeezUtils.track.transformMessageData(response.data, response.tracks || [], response.loadType, false, player, { guildLocale: interaction.guildLocale }))}).catch(console.warn);
        } else {
            // add fetchTime, only if song is the next song
            if(skipSong) response.tracks[0].fetchTime = fetchTime;

            if(!skipSong && !addSongToTop) player.queue.add(response.tracks)
            else player.queue.splice(0, 0, ...response.tracks);
            if(skipSong) player.stop();
            
            return await interaction.editReply({...(await client.DeezUtils.track.transformMessageData(response.data, response.tracks || [], response.loadType, true, player, { skipSong, addSongToTop, guildLocale: interaction.guildLocale }))}).catch(console.warn);
        }
    }
}
/**
 * 
 * @param {import("../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").CommandInteraction} interaction 
 * @param {{ data: any, tracks: any[] }} response 
 * @param {import("erela.js").Player} player 
 * @param {{name:string, link:string, fetchTime:number, created:boolean, previousQueue:number, skipSong:boolean, addSongToTop:boolean }} chartsPlData 
 * @returns 
 */
export async function handleChartsPlaylist(client, interaction, response, player, chartsPlData) {
    const { name, link, fetchTime, created, previousQueue, skipSong, addSongToTop } = chartsPlData;
    if(!response.tracks) return interaction.editReply({
        ephemeral: true,
        content: inlineLocale(interaction.guildLocale, "musicrequest.charts.execute.notracksplaylistfound", { name, link })
    });
    // declare that it's a playlist
    response.isPlaylist = true;

    // if a player was created, or the previous queue was empty, or there was no player before
    if (created || previousQueue === 0) {
        // add fetchTime, only if song is the next song
        if((!player.paused && !player.playing) || (!player.paused && player.playing)) response.tracks[0].fetchTime = fetchTime;
        // Add the Track(s)
        player.queue.add(response.tracks)
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

        return await interaction.editReply({...(await client.DeezUtils.track.transformMessageData(response, response.tracks || [], "CHARTS_LOADED", false, player, { guildLocale: interaction.guildLocale }))}).catch(console.warn);
    } else {
        // add fetchTime, only if song is the next song
        if(skipSong) response.tracks[0].fetchTime = fetchTime;

        if(!skipSong && !addSongToTop) player.queue.add(response.tracks)
        else player.queue.splice(0, 0, ...response.tracks);
        if(skipSong) player.stop();

        return await interaction.editReply({...(await client.DeezUtils.track.transformMessageData(response, response.tracks || [], "CHARTS_LOADED", true, player, { skipSong, addSongToTop, guildLocale: interaction.guildLocale }))}).catch(console.warn);
    }
}