import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Embed } from "../../structures/Embed.mjs";
import { i18n, inlineLocale, inlineLocalization } from "../../structures/i18n.mjs";

/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "logout",
    description: inlineLocale("EnglishUS", `logout.description`),
    cooldown: {
        user: 60 * 1000,
    },
    async execute(client, interaction) {
        await client.DeezApi.resetDeezerAccount(interaction.user.id);

        return interaction.reply({
            embeds: [
                new Embed()
                    .setTitle(inlineLocale(client.getGuildLocale(interaction.guild), `logout.execute.embedTitle`))
                    .setDescription(inlineLocale(client.getGuildLocale(interaction.guild), `logout.execute.embedDescription`))
            ],
            ephemeral: true
        })
    }
}