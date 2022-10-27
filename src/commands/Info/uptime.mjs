/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "uptime",
    description: "Shows the Bot's Uptime",
    localizations: [
        {name: ["de", "uptime"], description: ["de", "Zeige an wie lange ich schon laufe"]}
    ],
    category: "info",
    async execute(client, interaction) {
        await interaction.reply({
            ephemeral: true,
            content: inlineLocale(client.getGuildLocale(interaction.guild), `uptime.execute.content`, {
                time: Math.floor((Date.now() + client.uptime) / 1000),
            }) 
        });
    }
}