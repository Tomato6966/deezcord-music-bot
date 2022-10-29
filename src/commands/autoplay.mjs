import { optionTypes } from "../structures/BotClient.mjs";
import { inlineChoicesLocale, inlineDescriptionLocalization, inlineLocale } from "../structures/i18n.mjs";



/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "autoplay",
    description: inlineLocale("EnglishUS", `queuesettings.autoplay.description`),
    localizations: inlineDescriptionLocalization("autoplay", "queuesettings.autoplay.description"),
    category: "music#player",
    options: [
        {
            name: "add_tracks_per_fetch",
            description: inlineLocale("EnglishUS", `queuesettings.autoplay.options.add_tracks_per_fetch`),
            localizations: inlineDescriptionLocalization("add_tracks_per_fetch", "queuesettings.autoplay.options.add_tracks_per_fetch"),
            required: false,
            type: optionTypes.number,
            min: 3,
            max: 8,
        },
        {
            name: "tracks_requesting_type",
            description: inlineLocale("EnglishUS", `queuesettings.autoplay.options.tracks_requesting_type`),
            localizations: inlineDescriptionLocalization("tracks_requesting_type", "queuesettings.autoplay.options.tracks_requesting_type"),
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {
                    name: "Deezer Flow AI (New)", 
                    name_localizations: inlineChoicesLocale("queuesettings.autoplay.options.stringoptions.flow"),
                    value: "flow"
                },
                {
                    name: "Recommendations (Default)",
                    name_localizations: inlineChoicesLocale("queuesettings.autoplay.options.stringoptions.recommendations"),
                    value: "recommendations"
                },
            ]
        }
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

        const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(interaction, interaction.member, false, { playermustexist: true });
        if(!player) return;

        const addTracksPerFetch = Number(interaction.options.getNumber("add_tracks_per_fetch"));
        const useFlowInstead = interaction.options.getString("tracks_requesting_type") === "flow";
        let addTracksPerAutoplayFetchAmount = addTracksPerFetch && !isNaN(addTracksPerFetch) ? addTracksPerFetch : client.configData.addTracksPerAutoplayFetchAmount;
        
        const autoplays = player.get("autoplay") || [];
        const index = autoplays.findIndex(x => x.userId === interaction.user.id)
        if(index >= 0) {
            autoplays.splice(index, 1);
            player.set("autoplay", autoplays);
            return await interaction.reply({
                ephemeral: true,
                content: inlineLocale(interaction.guildLocale, "queuesettings.autoplay.execute.turnedoff")
            })
        }
        autoplays.push({ userId: interaction.user.id, deezerId, accessToken, addTracksPerAutoplayFetchAmount, useFlowInstead });
        
        player.set("autoplay", autoplays);

        interaction.reply({
            ephemeral: true,
            content: useFlowInstead ? inlineLocale(interaction.guildLocale, "queuesettings.autoplay.execute.turnedon_flow") : inlineLocale(interaction.guildLocale, "queuesettings.autoplay.execute.turnedon")
        })
    }
}