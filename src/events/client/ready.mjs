import { EnglishUS } from "../../data/Locales.mjs";

/** @param {import("../../structures/BotClient.mjs").BotClient} client */
export default async (client) => {
    client.logger.success(`Discord Bot is ready as ${client.user.tag}`);
    // update status
    client.updateStatus();
    setInterval(() => client.updateStatus(), client.DeezUtils.time.Millisecond.Minute(30))

    if(process.env.PUBLICSLASH === "true") {
        await client.publishCommands(process.env.DEVGUILD || undefined);
        await client.DeezUtils.time.delay(1000);
    }

    await client.prepareCommands();

    client.DeezCord.init(client.user.id, {
        shards: client.cluster.info.TOTAL_SHARDS,
        clientName: "Deezcord",
        clientId: client.user.id || process.env.DISCORD_CLIENT_ID, 
    });

    // ensure languages
    await client.db.guildSettings.findMany({
        select: { guildId: true, language: true }
    }).then(x => {
        x.filter(v => client.guilds.cache.has(v.guildId)).forEach(v => client.DeezCache.locales.set(v.guildId, v.language || EnglishUS));
    });
    client.regex.botMention = new RegExp(`^<@!?${process.env.DISCORD_CLIENT_ID}>\\s*`);
}
