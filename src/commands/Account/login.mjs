import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Embed } from "../../structures/Embed.mjs";
import { i18n, inlineLocale, inlineLocalization } from "../structures/i18n.mjs";

/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "login",
    description: inlineLocale("EnglishUS", `login.description`),
    cooldown: {
      user: 60 * 1000,
    },
    async execute(client, interaction) {
        const randomId = Math.random().toString(36).substring(2, 9);
        const url = 'https://deezcord.milrato.eu/login/' + randomId;

        const utils = {
            userId: interaction.user.id,
        }

        client.cluster.broadcastEval(
            /**
             * @param {client} c The Discord User Client
             */
            (c, utils) => {
                c.DeezCache.loginCache.set(randomId, {
                    userId: utils.userId,
                    validUntil: Date.now() + 10 * 60 * 1000
                });
            }, {cluster: 0, context: utils});

        const embed = new Embed()
            .setTitle(inlineLocale(client.getGuildLocale(interaction.guild), `login.execute.embedTitle`))
            .setDescription(inlineLocale(client.getGuildLocale(interaction.guild), `login.execute.embedDescription`))
            .setFooter({
                name: inlineLocale(client.getGuildLocale(interaction.guild), `login.execute.embedFooter`),
            });

        const Buttons = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                    .setLabel(inlineLocale(client.getGuildLocale(interaction.guild), `login.execute.embedTitle`))
                    .setURL(url)
                    .setStyle(ButtonStyle.Link),
            ]);


        return interaction.reply({
            embeds: [embed],
            components: [Buttons],
            ephemeral: true
        })
    }
}