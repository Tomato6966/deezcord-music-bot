import { Collection } from "discord.js";
import { TrackUtils } from "erela.js";

export const autoplayCount = new Collection();
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
*/
export default async (client, player) => {
    const guild = client.guilds.cache.get(player.guild);
    if(!guild) return player.destroy();

    client.logger.debug(`Player Queue ended in ${guild.name}`);
    await client.DeezUtils.time.delay(250);
    /** @type {import("../../structures/Utils/TrackUtils.mjs").DeezUnresolvedDataType} */
    const lastTrack = (player.get("previous")?.[0] || player.get("current") || player.queue.current || player.queue.previous);
    client.DeezCord.emit("trackEnd", player, lastTrack)
    
    const autoplays = player.get("autoplay") || []; // { userId, deezerId, accessToken }
    if(autoplays.length) {
        const autoplayUser = autoplays.find(x => x.userId === (lastTrack?.requester?.id || lastTrack?.requester));
        if(autoplayUser) {
            let res = null;
            if(autoplayUser.useFlowInstead) {
                res = await client.DeezApi.user.flow(autoplayUser.deezerId, autoplayUser.accessToken).then(x => {
                    if(typeof x === "object" && x.data?.length) x.data = x.data.filter(v => typeof v.readable === "undefined" || v.readable == true);
                    return x;
                });
            } else {
                res = await client.DeezApi.user.recommendations.tracks(autoplayUser.deezerId, autoplayUser.accessToken).then(x => {
                    if(typeof x === "object" && x.data?.length) x.data = x.data.filter(v => typeof v.readable === "undefined" || v.readable == true);
                    return x;
                });
            }
            if(res?.data?.length) {
                if(typeof lastTrack?.requester === "object" && !lastTrack?.requester.accessToken) lastTrack.requester.accessToken = autoplayUser.accessToken;
                if(typeof lastTrack?.requester === "object" && !lastTrack?.requester.deezerId) lastTrack.requester.deezerId = autoplayUser.deezerId;
                
                const autoplayedTrack = res.data.slice(0, autoplayUser?.addTracksPerAutoplayFetchAmount || client.configData.addTracksPerAutoplayFetchAmount);
                const oldCount = Number(autoplayCount.get(autoplayUser.userId) || 0) || 0;
                const formatted = autoplayedTrack.map((v, i) => TrackUtils.buildUnresolved(client.DeezUtils.track.createUnresolvedData(v, undefined, v?.album, true, oldCount + i + 1), lastTrack?.requester)).filter(v => typeof v.readable === "undefined" || v.readable == true)
                if(formatted.length) {
                    autoplayCount.set(autoplayUser.userId, oldCount + formatted.length);
                    
                    if(autoplayUser.useFlowInstead) formatted.forEach(x => x.flowTrack = true)

                    player.set(autoplayUser.useFlowInstead ? 'addedviaautoplay_flow' : "addedviaautoplay", formatted);
                    setTimeout(() => player.set(autoplayUser.useFlowInstead ? 'addedviaautoplay_flow' : "addedviaautoplay", undefined), 10000)

                    player.queue.add(formatted);
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
