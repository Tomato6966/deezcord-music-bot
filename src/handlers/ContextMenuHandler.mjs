import { EmbedBuilder } from "@discordjs/builders";
import { Collection, resolveColor } from "discord.js";
import { cooldownCategories, cooldownCategoriesHigh, cooldownCommands, cooldownCommandsHigh, defaultCooldownMs, defaultCooldownMsHigh, maximumCoolDownCommands } from "../data/Cooldowns.mjs";
import { onlySecondDuration } from "../utils/TimeUtils.mjs";
import { checkCommand, parseSlashCommandKey } from "./SlashCommandHandler.mjs";

/** 
 * @param {import("../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").CommandInteraction} interaction
*/
export async function contextMenuHandler(client, interaction) {

    // SOON: Ensure Languags

    // check permissions

    const contextCmd = client.commands.get(parseSlashCommandKey(interaction, true));

    // check perms for: - emojis, embed links etc.

    if(contextCmd) {
        try {
            if(!(await checkCommand(client, contextCmd, interaction))) return;
            
            await contextCmd.execute(client, interaction);
        } catch (e) {
            client.logger.error(e);
            const content = `**Something went wrong while executing \`${contextCmd?.name || "???"}\`:**\`\`\`\n${String(e?.message ?? e).substring(0, 500)}\n\`\`\``.substring(0, 1000);
            if(interaction.replied) {
                interaction.channel.send({ content }).catch(() => null);
            } else {
                interaction.reply({ content, ephemeral: true }).catch(() => {
                    interaction.channel.send({ content }).catch(() => null);
                })
            }
        }
    }
}