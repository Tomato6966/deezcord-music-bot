import { parseEmoji, PermissionFlagsBits } from "discord.js";
import { inlineLocale } from "../../../structures/i18n.mjs";
const cool = new Map();
/** 
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Message} message
*/
export default async (client, message) => {
    if(message.guildId && !message.guild || !message.channel) return;
    // check perm if the bot can see and view the channel.
    if(!client.DeezUtils.perms.checkPerms(message.channel, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) return
    
    const guildBotRole = message.guild.roles.cache?.find?.(r => r.tags?.botId === client.user.id);
    const isPingOfMe = message.mentions?.has?.(client.user.id) || message.mentions?.has?.(guildBotRole);
    
    if(!isPingOfMe) return;
    if(!client.regex.botMention.test(message.content)) return; // if not first arg mention
    
    if(cool.has(message.channelId)) {
        if(client.DeezUtils.perms.checkPerms(message.channel, PermissionFlagsBits.AddReactions)) return message.react(client.DeezEmojis.cooldown.parsed).catch(() => null)
        else return; 
    };
    cool.set(message.channelId, true);
    setTimeout(() => cool.delete(message.channelId), client.configData.mentionInfoCooldown);

    const hasCommand = client.commands.find(c => c.name === message.content?.split?.(/ +/g)?.[1]?.trim?.()?.toLowerCase?.());
    return message.reply({
        content: inlineLocale(guildLocale, "general.errors.useslashcmds", {
            slashCmdStr: hasCommand ? hasCommand?.mention || `\`/${hasCommand.name}\`` : inlineLocale(guildLocale, "general.phrases.slashcmds"),
            playCmd: `${client.commands.find(c => c.name === "play")?.mention || "`/play`"}`,
            linkCmd: `${client.commands.find(c => c.name === "login")?.mention || "`/login`"}`,
            supportServer: `${client.configData.supportServer}`
        })
    }).then(msg => {
        if(client.configData.deleteMentionInfoAfter && client.configData.deleteMentionInfoAfter > 0) {
            setTimeout(async () => {
                await msg?.delete?.()?.catch?.(console.warn);
                await message.react(client.DeezEmojis.deezcord.parsed)?.catch?.(console.warn);
            }, client.configData.deleteMentionInfoAfter)
        }
    }).catch(() => null)
}