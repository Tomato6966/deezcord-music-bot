
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
*/
export default async (client, player) => {
    const guild = client.guilds.cache.get(player.guild);
    if(!guild) return player.destroy();
    client.logger.debug(`Player Queue ended in ${guild.name}`);
    await client.DeezUtils.time.delay(250);
    const lastTrack = (player.get("current") || player.queue.current || player.get("previous")?.[0] || player.queue.previous);
    client.DeezCord.emit("trackEnd", player, lastTrack)
}
