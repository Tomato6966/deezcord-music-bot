
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
 * @param {import("discord.js").VoiceBasedChannel} oldChannel
*/
export default async (client, player, oldChannel) => {
    const guild = oldChannel.guild || client.guilds.cache.get(player.guild);
    if(!guild) return player.destroy();
    client.logger.debug(`Player got Disconnected in ${guild.name} from #${oldChannel.name}`);
    player.destroy();
}
