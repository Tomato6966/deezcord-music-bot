
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Node} node
 * @param {Error|SyntaxError} error
*/
export default async (client, node, error) => {
    client.logger.error(`Deezcord-Node ${node.options.identifier} got an error: `, error);
}