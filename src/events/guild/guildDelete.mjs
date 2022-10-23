
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Guild} guild
*/
export default async (client, guild) => {
    // clear guild specific caches & Db Datas
    client.DeezCache.locales.delete(guild.id)
    await client.db.guildSettings.delete({
        where: {
            guildId: guild.id
        }
    });
    await client.db.dJSettings.delete({
        where: {
            guildId: guild.id
        }
    });
    await client.db.disabledCommands.delete({
        where: {
            guildId: guild.id
        }
    });
}