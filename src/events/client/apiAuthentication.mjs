import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';

const dmCache = new Set();

/** @param {import("../../structures/BotClient.mjs").BotClient} client */
export default async (client, deezerResponse, discordUser) => {
    if (discordUser?.id) {
        const cacheId = discordUser?.id ?? deezerResponse?.id;

        await client.DeezApi.user.saveDeezerAccount(deezerResponse, discordUser.id);

        if (dmCache.has(cacheId)) return;
        if (cacheId) dmCache.add(cacheId);

        const Embed = new EmbedBuilder()
            .setTitle('New Login')
            .setDescription(`Hey ${discordUser.username}, your deezer account **${deezerResponse.name}** is now bound to this discord account!`);

        const Buttons = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                    .setLabel('Invite the Bot')
                    .setURL('https://discord.com/oauth2/authorize?client_id=1032998523123290182&scope=bot&permissions=279218310144')
                    .setStyle(ButtonStyle.Link),
            ])

        await discordUser.send({
            embeds: [Embed],
            components: []
        }).catch(err => {
        });

        setTimeout(() => {
            if (cacheId) dmCache.delete(cacheId);
        }, 30 * 1000);
    }
}