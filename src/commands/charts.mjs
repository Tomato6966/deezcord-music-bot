import { ActionRowBuilder, SelectMenuBuilder } from "@discordjs/builders";
import { TrackUtils } from "erela.js";
import { optionTypes } from "../structures/BotClient.mjs";
import { i18n, inlineLocale, inlineLocalization } from "../structures/i18n.mjs";
import { handleResSearchFilter } from "./play.mjs";

const errorCatcher = (e) => { console.warn(e); return null; };

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
        },
        {
            name: "country_playlist",
            description: inlineLocale("EnglishUS", `play.options.country_playlist`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "country_playlist", "play.options.country_playlist")),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {name: "True", value: "true" },
                {name: "False", value: "false" },
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
                content: `❌ You have to be logged in to Deezer, do it with: ${client.commands.get("login")?.mention || "`/login`"}`
            });
        */

        const searchFilter = interaction.options.getString("query_search_filter");
        const limit = interaction.options.getNumber("limit") && isNaN(interaction.options.getNumber("limit")) ? Number(interaction.options.getNumber("limit")) : 100;
        const skipSong = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "skip";
        const addSongToTop = interaction.options.getString("queueaction") && interaction.options.getString("queueaction") === "addontop";
        const chartCountryPlaylist = interaction.options.getString("country_playlist");
        const takeWorldWide = chartCountryPlaylist && chartCountryPlaylist == "worldwide";
        const takeSpecific = chartCountryPlaylist && chartCountryPlaylist == "true";
        
        const access_token = await client.db.userData.findFirst({
            where: { userId : interaction.user.id }, select: { deezerToken: true }
        }).then(x => x?.deezerToken).catch(() => undefined);

        await interaction.reply({
            ephemeral: true,
            content: `Now searching the charts${searchFilter ? `for \`${searchFilter}\`` : ``}`
        });

        const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(interaction, interaction.member, true);
        if(!player) return;

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
            return handleResSearchFilter(client, interaction, res, searchFilter?.endsWith("s") ? searchFilter.substring(0, searchFilter.length - 1) : searchFilter, skipSong, addSongToTop)
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
            content: `❌ No Tracks found`
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
                }).then(x => x?.defaultvolume || 100),
                startTime: 0,
            });
            if(!player.paused && !player.playing) player.pause(false);

            return await interaction.editReply({...(await client.DeezUtils.track.transformMessageData(response.data, response.tracks || [], response.loadType, false, player))}).catch(console.warn);
        } else {
            // add fetchTime, only if song is the next song
            if(skipSong) response.tracks[0].fetchTime = fetchTime;

            if(!skipSong && !addSongToTop) player.queue.add(response.tracks)
            else player.queue.splice(0, 0, ...response.tracks);
            if(skipSong) player.stop();

            return await interaction.editReply({...(await client.DeezUtils.track.transformMessageData(response.data, response.tracks || [], response.loadType, true, player, { skipSong, addSongToTop }))}).catch(console.warn);
        }
    }
}