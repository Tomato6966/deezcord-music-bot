
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Node} node
*/
export default async (client, node) => {
    client.logger.success(`Deezcord-Node ${node.options.identifier} connected`);
}
