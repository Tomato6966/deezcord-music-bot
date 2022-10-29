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
}
