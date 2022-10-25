import { PermissionFlagsBits } from "discord.js";

/** 
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Message} message
*/
export default async (client, message) => {
    if(interaction.guildId && !interaction.guild || !message.channel) return;

    // check perm if the bot can see and view the channel.
    if(!client.DeezUtils.perms.checkPerms(message.channel, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) return
    
    const guildBotRole = message.guild.roles.cache?.find?.(r => r.tags?.botId === client.user.id);
    const isPingOfMe = message.mentions?.has?.(client.user.id) || message.mentions?.has?.(guildBotRole);
    
    if(!isPingOfMe) return;
    const hasCommand = client.commands.find(c => c.name === message.content?.split?.(/ +/g)?.[1]?.trim?.()?.toLowerCase?.());
    return message.reply({
        content: `😒 Sorry, but you must use ${hasCommand ? hasCommand?.mention || `\`/${hasCommand.name}\`` : "Slash Commands"}, to get started use: ${client.commands.find(c => c.name === "play")?.mention || "`/play`"}\n> Or **link your account:** ${client.commands.find(c => c.name === "login")?.mention || "`/login`"}\n> **Need Support ☎️** ${client.configData.supportServer}`
    }).catch(() => null)
}