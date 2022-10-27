/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "stats",
    description: "Shows the Bot's Stats",
    category: "info",
    async execute(client, interaction) {
        const thisStats = await client.DeezUtils.bot.receiveBotInfo();
        console.log(thisStats)
        await interaction.reply({
            ephemeral: true,
            content: `\`\`\`\n${thisStats}\n\`\`\``
        });
    }
}