
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Node} node
*/
export default async (client, node) => {
    client.logger.info(`Deezcord-Node ${node.options.identifier} created`);
    if(client.isReady() && !node.connected) node.connect();
}