import { autoplayCount } from "./queueEnd.mjs";

/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
*/
export default async (client, player) => {
    const guild = client.guilds.fetch(player.guild);
    if(!guild) return player.destroy();
    client.logger.debug(`Player got Created in ${guild.name}`);

    autoplayCount.clear();
    player.set("autoplays", []);

    // ensure player dj settings
    client.db.dJSettings.findFirst({
        where: { guildId: player.guild },
        select: { enabled: true, access: true, djonlycommands: true }
    }).then(x => {
        const djonlycommands = x?.djonlycommands || ["bassboost", "bettermusiceq", "clearfilters", "echo", "karaoke", "lowpass", "nightcore", "pitch", "rate", "pop", "speed", "rotating", "resume", "rewind", "seek", "shuffle", "skip", "stop", "stoploop", "unshuffle", "volume", "autoplay", "clearqueue", "forward", "jump", "leave", "loop", "move", "pause", "playskip", "playtop", "removedupes", "replay", "tremolo"];
        const access = x.access ?? [];
        const enabled = x.enabled;
        if(enabled) {
            player.set("djcommands", djonlycommands);
            player.set("djroles", access);
        }
        player.set("djenabled", !!enabled);
    }).catch(console.warn)
}
