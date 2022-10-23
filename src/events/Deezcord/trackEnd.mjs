
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
 * @param {import("erela.js").Track} track
*/
export default async (client, player, track) => {
    const guild = client.guilds.cache.get(player.guild);
    if(!guild) return palyer.destroy();
    client.logger.debug(`Track ended in ${guild.name}`);
    client.DeezUtils.track.handleEnd(player, track);
}
