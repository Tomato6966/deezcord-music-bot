
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
 * @param {import("erela.js").Track} track
 * @param {any} error
*/
export default async (client, player, track, error) => {
    const guild = client.guilds.cache.get(player.guild);
    if(!guild) return palyer.destroy();
    client.logger.debug(`Track errored in ${guild.name}`, error);
    client.DeezUtils.track.handleEnd(player, track);
    
    // skip the track
    if(!player.playing && !player.paused) {
        const newTrack = player.queue[0];
        if(!newTrack) { player.destroy(); }
        else player.play(newTrack);
    }
    else {
        const newTrack = player.queue[0];
        if(!newTrack) { player.destroy(); }
        else player.stop();
    }
}
