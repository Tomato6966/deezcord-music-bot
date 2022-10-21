/** @type {import("../../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "ping",
    description: "Shows the Bot's Ping",
    localizations: [
        {name: ["de", "ping"], description: ["de", "Zeige meine Latenzzeit an"]}
    ],
    async execute(client, interaction) {
        await interaction.reply({
            ephemeral: true,
            content: `🏓 Pong \`${client.ws.ping}ms\``
        });
    }
}