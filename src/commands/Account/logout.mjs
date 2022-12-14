import { Embed } from "../../structures/Embed.mjs";
import { i18n, inlineLocale, inlineLocalization } from "../../structures/i18n.mjs";

/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "logout",
    description: inlineLocale("EnglishUS", `account.logout.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "logout", "account.logout.description")),
    cooldown: {
        user: 60 * 1000,
    },
    async execute(client, interaction) {
        await client.DeezApi.resetDeezerAccount(interaction.user.id);
        // loggout discord link ?
        return interaction.reply({
            embeds: [
                new Embed()
                    .setTitle(inlineLocale(interaction.guildLocale, `account.logout.execute.embedTitle`))
                    .setDescription(inlineLocale(interaction.guildLocale, `account.logout.execute.embedDescription`))
            ],
            ephemeral: true
        })
    }
}