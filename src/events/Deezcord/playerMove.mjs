
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
 * @param {import("discord.js").VoiceBasedChannel} oldChannel
 * @param {import("discord.js").VoiceBasedChannel} newChannel
*/
export default async (client, player, oldChannel, newChannel) => {
    const guild = oldChannel.guild || newChannel.guild || client.guilds.cache.get(player.guild);
    if(!guild) return palyer.destroy();
    client.logger.debug(`Player got Moved in ${guild.name} from #${oldChannel.name} to #${newChannel.name}`);

    player.voiceChannel = newChannel;
    
    if (player.paused) return;
    
    setTimeout(() => {
        player.pause(true);
        setTimeout(() => player.pause(false), 150);
    }, 150);
}
