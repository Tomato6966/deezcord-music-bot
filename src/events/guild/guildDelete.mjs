
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Guild} guild
*/
export default async (client, guild) => {
    // clear guild specific caches & Db Datas
    deleteDatabaseData(client, guild);
    checkPlayerGuildDestroy(client, guild);
    return;
}

/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Guild} guild
*/
export async function checkPlayerGuildDestroy(client, guild) {
    const player = client.DeezCord.players.get(guild.id);
    if(player) player.destroy(); 
    return;
}

/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Guild} guild
*/
export async function deleteDatabaseData(client, guild) {
    client.DeezCache.locales.delete(guild.id)

    await client.db.guildSettings.delete({
        where: {
            guildId: guild.id
        }
    }).catch(console.warn);

    await client.db.dJSettings.delete({
        where: {
            guildId: guild.id
        }
    }).catch(console.warn);
    return;
}