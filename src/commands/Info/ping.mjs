import { i18n, inlineLocale, inlineLocalization } from "../../structures/i18n.mjs";

/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "ping",
    description: inlineLocale("EnglishUS", `info.ping.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "ping", "info.ping.description")),
    category: "info",
    async execute(client, interaction) {
        await interaction.reply({
            ephemeral: true,
            content: inlineLocale(client.getGuildLocale(interaction.guild), `info.ping.execute.content`, {
                wsPing: client.ws.ping
            })
        });
    }
}