import { i18n, inlineLocale } from "../../structures/i18n.mjs";

/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "ping",
    description: inlineLocale("EnglishUS", `ping.description`),
    localizations: i18n.getLocales().map(locale => [
        { name: [locale, "ping"], description: [ locale,`ping.description` ] }
    ]),
    category: "info",
    async execute(client, interaction) {
        await interaction.reply({
            ephemeral: true,
            content: inlineLocale(client.getGuildLocale(interaction.guild), `ping.execute.content`, {
                wsPing: client.ws.ping
            })
        });
    }
}