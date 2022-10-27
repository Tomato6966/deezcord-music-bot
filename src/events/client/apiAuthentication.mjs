import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import { mainColor } from "../../data/ConfigData.mjs";
const dmCache = new Set();

/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("../../structures/APIClient.mjs").DeezerResponseObject} deezerResponse
 * @param {(import("discord.js").User & { guilds: string[] }) | { id:string, username: string, guilds: string[] } } discordUser
 */
export default async (client, deezerResponse, discordUser) => {
    if (discordUser?.id) {
        await client.DeezApi.user.saveDeezerAccount(deezerResponse, discordUser.id);

        const keys = [ discordUser?.id, deezerResponse?.id ].filter(Boolean)

        if(keys.length && keys.some(key => dmCache.has(key))) return;
        keys.forEach(key => dmCache.add(key));

        await discordUser?.send?.({
            embeds: [
                new EmbedBuilder()
                    .setColor(mainColor)
                    .setTitle('New Login')
                    .setDescription(`Hey **${discordUser.username}**, your Deezeraccount [**${deezerResponse.name}**](${deezerResponse.link ?? `https://www.deezer.com/profile/${deezerResponse.id}`}) is now bound to this discord account!`)
            ]
        })?.catch?.(() => null);

        setTimeout(() => keys.forEach(key => dmCache.delete(key)), 30 * 1000);
    }
}