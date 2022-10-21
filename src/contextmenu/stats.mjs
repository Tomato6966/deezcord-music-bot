import { ApplicationCommandType } from "discord.js";

/** @type {import("../data/DeezCordTypes.mjs").ContextExport} */
export default {
    name: "stats",
    localizations: [
        {name: ["de", "stats"]}
    ],
    type: ApplicationCommandType.User,
    async execute(client, interaction) {
        await interaction.reply({
            ephemeral: true,
            content: `Here are your Stats`
        });
    }
}