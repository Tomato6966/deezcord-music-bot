import { ActivityType } from "discord.js";
import { Millisecond } from "../../utils/TimeUtils.mjs";

/** @param {import("../../structures/BotClient.mjs").BotClient} client */
export default async (client) => {
    client.logger.info(`Discord Bot is ready as ${client.user.tag}`);
    // update status
    statusUpdater(client); setInterval(() => statusUpdater(client), Millisecond.Minute(30))

    if(process.env.PUBLICSLASH === "true") await client.publishCommands(process.env.DEVGUILD || undefined);
    client.prepareCommands();
}

/** @param {import("../../structures/BotClient.mjs").BotClient} client */
export async function statusUpdater(client) {
    const shardIds = [...client.cluster.ids.keys()];
    // 8 .... 0
    const { guilds, members } = await client.cluster.broadcastEval("this.guildsAndMembers").then(x => {
        return {
            guilds: x.map(v => v.guilds || 0).reduce((a, b) => a + b, 0),
            members: x.map(v => v.members || 0).reduce((a, b) => a + b, 0)
        }
    }).catch((e) => {
        client.logger.error(e);
        return { guilds: 0, members: 0 }
    })
    for (let i = shardIds.length - 1; i >= 0; i--) {
        const shardId = shardIds[i];
        client.user.setActivity(`Deezer.com on shard #${shardId}`, { shardId, type: ActivityType.Listening })
    }
}