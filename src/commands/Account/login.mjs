import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "login",
    description: "Connect your deezer account with this bot",
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

        const Embed = new EmbedBuilder()
            .setTitle('Login')
            .setDescription('In order to interact with tracks, playlists, artists and radios you have to logged.')
            .setFooter({
                name: 'Don\'t share this link with someone!',
            });

        const Buttons = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                    .setLabel('Login')
                    .setURL(url)
                    .setStyle(ButtonStyle.Link),
            ]);


        return interaction.reply({
            embeds: [Embed],
            components: [Buttons],
            ephemeral: true
        })
    }
}