
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Track} track
 * @param {import("erela.js").Player} player
*/
export default async (client, track, player) => {
    const guild = client.guilds.cache.get(player.guild);
    if(!guild) return player.destroy();

    client.logger.debug(`Now playing the Track ${track.author} - ${track.title} in ${guild.name}, requested by @${client.DeezUtils.track.getRequesterString(track.requester)}`);
    
    // get lyrics of db, from deezer and if not then from genius
    const ofDBDeezer = await this.client.db.deezerLyrics.findFirst({
        where: { trackId: String(identifier) },
        select: { LYRICS_ID: true, LYRICS_TEXT: true, LYRICS_WRITERS: true, LYRICS_COPYRIGHTS: true, LYRICS_SYNC_JSON: true }
    })
    if(ofDBDeezer && ofDBDeezer.LYRICS_TEXT) {
        player.queue.current.deezerLyrics = ofDBDeezer;
        track.deezerLyrics = ofDBDeezer;
    } else {
        const ofDbRes = await client.db.lyrics.findFirst({
            where: { trackId: track.identifier },
            select: { lyrics: true }
        }).catch(() => null);
        if(ofDbRes?.lyrics) {
            player.queue.current.geniusLyrics = ofDbRes?.lyrics;
            track.geniusLyrics = ofDbRes?.lyrics;
        }
    }
    // track.deezerLyrics || track.geniusLyrics;


    // send now playing message


    // now get the lyrics, and then edit the message --> track.deezerLyrics || track.geniusLyrics;
    const lyricsTime = Date.now();
    if(!track.deezerLyrics) {
        const lyrics = await client.DeezUtils.track.getLyricsOfDeezer(track)
        if(lyrics) {
            if((Date.now() - lyricsTime) < 2000) await client.DeezUtils.time.delay(2000 - (Date.now() - lyricsTime));
            player.queue.current.deezerLyrics = lyrics;
            track.deezerLyrics = lyrics;
        } else if(!track.geniusLyrics) { // else try to get from genius Lyrics
            const geniusLyrics = await client.DeezUtils.track.getLyricsOfGenius(track)
            if(geniusLyrics) {
                if((Date.now() - lyricsTime) < 2000) await client.DeezUtils.time.delay(2000 - (Date.now() - lyricsTime));
                player.queue.current.geniusLyrics = lyrics;
                track.geniusLyrics = lyrics;
            }
        }
        // Edit now playing message that lyrics are available
    }
}