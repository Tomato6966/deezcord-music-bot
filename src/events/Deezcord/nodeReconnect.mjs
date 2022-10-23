
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Node} node
*/
export default async (client, node) => {
    client.logger.debug(`Deezcord-Node ${node.options.identifier} is reconnecting`);
}
