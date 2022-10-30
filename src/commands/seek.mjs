import { optionTypes } from "../structures/BotClient.mjs";
import { i18n, inlineChoicesLocale, inlineLocale, inlineLocalization } from "../structures/i18n.mjs";

/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "seek",
    description: inlineLocale("EnglishUS", `songmanipulation.seek.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "seek", "songmanipulation.seek.description")),
    category: "music#player",
    options: [
        {
            name: "forward_amount",
            description: inlineLocale("EnglishUS", `songmanipulation.seek.options.forward_amount`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "forward_amount", "songmanipulation.seek.options.forward_amount")),
            required: false,
            type: optionTypes.number,
            min: 1,
        },
        {
            name: "seek_amount",
            description: inlineLocale("EnglishUS", `songmanipulation.seek.options.seek_amount`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "seek_amount", "songmanipulation.seek.options.seek_amount")),
            required: false,
            type: optionTypes.number,
            min: 1,
        },
        {
            name: "rewind_amount",
            description: inlineLocale("EnglishUS", `songmanipulation.seek.options.rewind_amount`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "rewind_amount", "songmanipulation.seek.options.rewind_amount")),
            required: false,
            type: optionTypes.number,
            min: 1,
        },
        {
            name: "replay_song",
            description: inlineLocale("EnglishUS", `songmanipulation.seek.options.replay_song`),
            localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "replay_song", "songmanipulation.seek.options.replay_song")),
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
        }
    ],
    async execute(client, interaction) {
        
        const { player } = await client.DeezUtils.track.createPlayer(interaction, interaction.member, false, { playermustexist: true });
        if(!player) return;
        
        if(!client.DeezUtils.track.isDjAllowed(interaction, interaction.member, "seek", player));

        const shouldReplay = interaction.options.getString("replay_song") && interaction.options.getString("replay_song") == "True";
        
        const trackTimeInSec = Math.floor(player.queue.current.duration / 1000)
        const currentPositionInSec = Math.floor(player.position / 1000)

        let time = "null";  
        
        if(shouldReplay) {
            time === 0
        }  else {
            const timeRWD = Number(interaction.options.getNumber("rewind_amount")); 
            if(timeRWD && !isNaN(timeRWD)) time = currentPositionInSec - timeRWD;  
            const timeFWD = Number(interaction.options.getNumber("forward_amount"));   
            if(timeFWD && !isNaN(timeFWD)) time = currentPositionInSec + timeFWD; 
            const timeSEEK = Number(interaction.options.getNumber("seek_amount")); 
            if(timeSEEK && !isNaN(timeSEEK)) time = timeSEEK; 

            if(time === "null") time = currentPositionInSec + 20
            
            if(!shouldReplay && (isNaN(time) || time >= trackTimeInSec || time < 0)) return interaction.reply({
                ephemeral: true,
                content: `${client.DeezEmojis.error.str} Time must be between: \`1\` and \`${trackTimeInSec}\``
            });            
        }
        await player.seek(time * 1000);

        interaction.reply({
            ephemeral: false,
            content: `${client.DeezEmojis.approve.str} Seeked to \`${client.DeezUtils.time.durationFormatted(time, false)}\``
        });
    }
}