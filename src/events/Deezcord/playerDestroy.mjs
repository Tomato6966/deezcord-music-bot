
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
*/
export default async (client, player) => {
    const guild = client.guilds.cache.get(player.guild);
    if(!guild) return;
    client.logger.debug(`Player got Destroyed in ${guild.name}`);
}
