import { EnglishUS } from "../../data/Locales.mjs";

/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Guild} guild
*/
export default async (client, guild) => {
    client.DeezCache.locales.set(guild.id, EnglishUS)
}