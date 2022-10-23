
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Node} node
*/
export default async (client, node) => {
    client.logger.error(`Deezcord-Node ${node.options.identifier} got destroyed`);
    const createdNode = client.DeezCord.createOptions.nodes.find(c => c.identifier == node.options.identifier);
    if(createdNode) {
        const n = new (Structure.get("Node"))(createdNode);
        client.logger.debug("Deezcord-Node Recreating destroyed node", createdNode, n);
    }
    else {
        client.logger.debug("Deezcord-Node ---> COULD NOT FIND THE NODE, trying with old options");
        new (Structure.get("Node"))(node.options);
    }
}