
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Node} node
 * @param {string|undefined} reason
*/
export default async (client, node, reason) => {
    client.logger.warn(`Deezcord-Node ${node.options.identifier} disconnected ${reason ? `with the reason: ${reason}` : `wthout a reason`}`);
}
