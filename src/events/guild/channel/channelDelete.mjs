/** 
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Channel} channel
*/
export default async (client, channel) => {
    checkPlayerChannelDestroy(client, channel);
}

/** 
 * Check if the player needs to be destroyed
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Channel} channel
*/
export function checkPlayerChannelDestroy(client, channel) {
    if(!channel.isVoiceBased()) return;
    const player = client.DeezCord.players.get(channel.guildId);
    if(player && channel.id === player.voiceChannel) player.destroy(); 
    return true;
}