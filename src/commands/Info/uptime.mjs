import { i18n, inlineLocale, inlineLocalization } from "../../structures/i18n.mjs";

/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "uptime",
    description: inlineLocale("EnglishUS", `info.uptime.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "uptime", "info.uptime.description")),
    category: "info",
    async execute(client, interaction) {
        await interaction.reply({
            ephemeral: true,
            content: inlineLocale(interaction.guildLocale, `info.uptime.execute.content`, {
                time: Math.floor((Date.now() + client.uptime) / 1000),
            }) 
        });
    }
}