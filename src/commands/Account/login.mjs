import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Embed } from "../../structures/Embed.mjs";
import { i18n, inlineLocale, inlineLocalization } from "../../structures/i18n.mjs";

/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "login",
    description: inlineLocale("EnglishUS", `login.description`),
    cooldown: {
      user: 60 * 1000,
    },
    async execute(client, interaction) {
        const url = client.DeezApi.discordLoginLink;

        return interaction.reply({
            embeds: [
                new Embed()
                    .setTitle(inlineLocale(client.getGuildLocale(interaction.guild), `login.execute.embedTitle`))
                    .setDescription(inlineLocale(client.getGuildLocale(interaction.guild), `login.execute.embedDescription`))
                    .setFooter({
                        text: inlineLocale(client.getGuildLocale(interaction.guild), `login.execute.embedFooter`),
                    })
            ],
            components: [
                new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setLabel(inlineLocale(client.getGuildLocale(interaction.guild), `login.execute.embedTitle`))
                        .setURL(url)
                        .setStyle(ButtonStyle.Link),
                ])
            ],
            ephemeral: true
        })
    }
}