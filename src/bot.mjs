import { BotClient } from "./structures/BotClient.mjs";
// https://discord.com/api/oauth2/authorize?client_id=1032998523123290182&permissions=2192919040&scope=bot
const client = new BotClient();

client.logger.info("Now starting the bot");
client.login(process.env.DISCORD_TOKEN)