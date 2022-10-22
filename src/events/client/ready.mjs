import { ActivityType } from "discord.js";
import { Millisecond } from "../../utils/TimeUtils.mjs";

/** @param {import("../../structures/BotClient.mjs").BotClient} client */
export default async (client) => {
    client.logger.success(`Discord Bot is ready as ${client.user.tag}`);
    // update status
    client.updateStatus();
    setInterval(() => client.updateStatus(), Millisecond.Minute(30))

    if(process.env.PUBLICSLASH === "true") await client.publishCommands(process.env.DEVGUILD || undefined);
    client.prepareCommands();

    client.deezCord.init(client.user.id, {
        shards: client.cluster.info.TOTAL_SHARDS,
        clientName: "Deezcord",
        clientId: client.user.id, 
    });
}
