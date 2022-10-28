import { Collection } from "discord.js";
import { TrackUtils } from "erela.js";

export const autoplayCount = new Collection();
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
*/
export default async (client, player) => {
    console.log("TEST");
    const guild = client.guilds.cache.get(player.guild);
    if(!guild) return player.destroy();

    client.logger.debug(`Player Queue ended in ${guild.name}`);
    await client.DeezUtils.time.delay(250);
    /** @type {import("../../structures/Utils/TrackUtils.mjs").DeezUnresolvedDataType} */
    const lastTrack = (player.get("current") || player.queue.current || player.get("previous")?.[0] || player.queue.previous);
    client.DeezCord.emit("trackEnd", player, lastTrack)
    
    const autoplays = player.get("autoplay") || []; // { userId, deezerId, accessToken }
    if(autoplays.length) {
        const autoplayUser = autoplays.find(x => x.userId === (lastTrack?.requester?.id || lastTrack?.requester));
        if(autoplayUser) {
            const res = await client.DeezApi.user.recommendations.tracks(autoplayUser.deezerId, autoplayUser.accessToken, 5).then(x => {
                if(typeof x === "object" && x.data?.length) x.data = x.data.filter(v => typeof v.readable === "undefined" || v.readable == true);
                return x;
            });
            if(res?.data?.length) {
                if(typeof lastTrack?.requester === "object" && !lastTrack?.requester.accessToken) lastTrack.requester.accessToken = autoplayUser.accessToken;
                if(typeof lastTrack?.requester === "object" && !lastTrack?.requester.deezerId) lastTrack.requester.deezerId = autoplayUser.deezerId;
                
                
                const autoplayedTrack = res.data.slice(0, autoplayUser?.addTracksPerAutoplayFetchAmount || client.configData.addTracksPerAutoplayFetchAmount);
                const formatted = autoplayedTrack.map(v => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v, undefined, v?.album, true, autoplayCount), lastTrack?.requester)).filter(v => typeof v.readable === "undefined" || v.readable == true)
                if(formatted.length) {
                    autoplayCount.set(autoplayUser.userId, Number(autoplayCount.get(autoplayUser.userId) || 0) + 1);
                    
                    player.set("addedviaautoplay", formatted);
                    
                    player.queue.add(formatted);
                    
                    setTimeout(() => player.set("addedviaautoplay", undefined), 10000)

                    if(!player.paused && !player.playing) player.play();
                    else player.stop();
                    
                    if(player.paused) player.pause(false);

                    return
                }
            }
        }
    }

    return player.destroy();
}
