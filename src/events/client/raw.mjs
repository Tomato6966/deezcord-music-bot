/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
*/

export default async (client, data, shard) => {
    switch(data.t) {
        case "VOICE_SERVER_UPDATE":
        case "VOICE_STATE_UPDATE":
            client.DeezCord.updateVoiceState(data.d)
        break;
    }
}