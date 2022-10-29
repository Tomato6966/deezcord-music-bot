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

    interaction.user = interaction.user ?? await client.users.fetch(interaction.userId).catch(() => null);
    interaction.member = interaction.member ?? await interaction.guild.members.fetch(interaction.user.id).catch(() => null)
    interaction.attachments = new Collection();
    
    interaction.guildLocale = client.getGuildLocale(interaction.guildId);
        
    // here we can execute messageCreate functions...
    if(interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) return contextMenuHandler(client, interaction);
    if(interaction.isCommand()) return slashCommandHandler(client, interaction);
}