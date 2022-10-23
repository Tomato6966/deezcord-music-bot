
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Track} track
 * @param {import("erela.js").Player} player
*/
export default async (client, track, player) => {
    const guild = client.guilds.cache.get(player.guild);
    if(!guild) return player.destroy();

    client.logger.debug(`Now playing the Track ${track.author} - ${track.title} in ${guild.name}, requested by @${client.DeezUtils.track.getRequesterString(track.requester)}`);
    
    const ofDbRes = await client.db.lyrics.findFirst({
        where: { trackId: track.identifier },
        select: { lyrics: true }
    }).catch(() => null);

    if(ofDbRes?.lyrics) {
        player.queue.current.lyrics = ofDbRes?.lyrics;
        track.lyrics = ofDbRes?.lyrics;
    }

    const lyricsTime = Date.now();
    if(!track.lyrics) {
        client.DeezUtils.track.getLyrics(track).then(async lyrics => {
            if((Date.now() - lyricsTime) < 2000) await client.DeezUtils.time.delay(2000 - (Date.now() - lyricsTime));
            if(lyrics) {
                track.lyrics = lyrics;
                player.queue.current.lyrics = lyrics;
            }
            // Edit now playing message that embeds are available
        })?.catch?.(console.warn)

    }
}