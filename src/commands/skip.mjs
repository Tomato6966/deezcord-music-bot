import { optionTypes } from "../structures/BotClient.mjs";
import { inlineLocale } from "../structures/i18n.mjs";

/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "skip",
    description: inlineLocale("EnglishUS", `queuemanagement.skip.description`),
    localizations: inlineDescriptionLocalization("skip", "queuemanagement.skip.description"),
    category: "music#player",
    options: [
        {
            name: "skip_to",
            description: inlineLocale("EnglishUS", `queuemanagement.skip.options.skip_to`),
            localizations: inlineDescriptionLocalization("skip_to", "queuemanagement.skip.options.skip_to"),
            type: optionTypes.number,
            required: false,
            min: 1
        }
    ],
    cooldown: {
        user: 5000,
        guild: 3000,
    },
    async execute(client, interaction) {
        
        const { player } = await client.DeezUtils.track.createPlayer(interaction, interaction.member, false, { playermustexist: true });
        if(!player) return;
        
        if(!player.queue.size && !client.DeezUtils.track.autoplayAble(player)) {
            return interaction.reply({
                ephemeral: true,
                content: inlineLocale(interaction.guildLocale, "queuemanagement.skip.execute.no_upcoming_tracks")
            });
        }

        const jumpTo = (Number(interaction.options.getNumber("skip_to")) || 1);
        if(jumpTo > 1 && jumpTo > player.queue.size) {
            return await interaction.reply({
                ephemeral: true, 
                content: inlineLocale(interaction.guildLocale, "queuemanagement.skip.execute.tracknotexisting", {
                    jumpTo: jumpTo,
                    queueSize: player.queue.size
                })
            });
        } 

        const removed = jumpTo > 1 ? player.queue.splice(0, Number(jumpTo) - 1) : null;
        if(player.queueRepeat && removed?.length) player.queue.add(removed);
        player.stop();

        if(jumpTo > 1) {
            return interaction.reply({
                ephemeral: false,
                content: inlineLocale(interaction.guildLocale, "queuemanagement.skip.execute.skippedto", {
                    jumpTo: jumpTo
                })
            });
        }
        interaction.reply({
            ephemeral: false,
            content: inlineLocale(interaction.guildLocale, "queuemanagement.skip.execute.skipped")
        });
    }
}