
/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Node} node
*/
export default async (client, node) => {
    client.logger.success(`Deezcord-Node ${node.options.identifier} connected`);
    if(node.reconnectAttempts > 1) node.reconnectAttempts = 1;
}

// all DeezCord Events
// nodeCreate
// nodeDestroy
// nodeDisconnect
// nodeError
// nodeRaw
// nodeReconnect
// playerCreate
// playerDestroy
// playerDisconnect
// playerMove
// queueEnd
// socketClosed
// trackEnd
// trackError
// trackStart
// trackStuck