/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "stats",
    description: "Shows the Bot's Stats",
    async execute(client, interaction) {
        const thisStats = await client.DeezUtils.bot.receiveBotInfo();
        console.log(thisStats)
        await interaction.reply({
            ephemeral: true,
            content: `🏓 Pong \`${client.ws.ping}ms\``
        });
    }
}