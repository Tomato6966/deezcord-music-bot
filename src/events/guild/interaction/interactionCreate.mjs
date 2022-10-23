import { Collection, InteractionType } from "discord.js";
import { contextMenuHandler } from "../../../handlers/ContextMenuHandler.mjs";
import { slashCommandHandler } from "../../../handlers/SlashCommandHandler.mjs";
import { inlineLocale } from "../../../structures/i18n.mjs";

/** 
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Interaction} interaction
*/
export default async (client, interaction) => {
    if(interaction.guildId && !interaction.guild) return;

    interaction.user = interaction.user ?? client.users.cache.get(interaction.userId) ?? await client.users.fetch(interaction.userId).catch(() => null);
    interaction.member = interaction.member ?? interaction.guild.members.cache.get(interaction.user.id) ?? await interaction.guild.members.fetch(interaction.user.id).catch(() => null)
    interaction.attachments = new Collection();
        

    // here we can execute messageCreate functions...
    if(interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) return contextMenuHandler(client, interaction);
    if(interaction.isCommand()) return slashCommandHandler(client, interaction);
}