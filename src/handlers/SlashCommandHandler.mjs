import { EmbedBuilder } from "@discordjs/builders";
import { Collection, resolveColor } from "discord.js";
import { cooldownCategories, cooldownCategoriesHigh, cooldownCommands, cooldownCommandsHigh, defaultCooldownMs, defaultCooldownMsHigh, maximumCoolDownCommands } from "../data/Cooldowns.mjs";
import { onlySecondDuration } from "../utils/TimeUtils.mjs";

/** 
 * @param {import("../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").CommandInteraction} interaction
*/
export async function slashCommandHandler(client, interaction) {

    // SOON: Ensure Languags

    // check permissions

    const slashCmd = client.commands.get(parseSlashCommandKey(interaction));

    // check perms for: - emojis, embed links etc.

    if(slashCmd) {
        try {
            if(!(await checkCommand(client, slashCmd, interaction))) return;
            
            await slashCmd.execute(client, interaction);
        } catch (e) {
            client.logger.error(e);
            const content = `**Something went wrong while executing \`${slashCmd?.name || "???"}\`:**\`\`\`\n${String(e?.message ?? e).substring(0, 500)}\n\`\`\``.substring(0, 1000);
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

/** @param {import("discord.js").CommandInteraction} interaction */
export function parseSlashCommandKey(interaction, contextmenu) {
    if(contextmenu) {
        return `contextcmd_${interaction.commandName}`
    }
    const keys = ["slashCmd", interaction.commandName];
    if(interaction.options._subcommand) { keys.push(`${interaction.options._subcommand}`); keys[0] = "subcmd"; }
    if(interaction.options._group) { keys.splice(1, 0, `${interaction.options._group}`); keys[0] = "groupcmd"; }
    return keys.join("_");
}

export async function checkCommand(client, command, ctx, ...extras) {
    const { dontCheckCooldown } = extras?.[0] || {};

    if(command.guildOnly && !ctx.guild) {
        return await ctx.reply({
            ephemeral: true,
            embeds: [
                new EmbedBuilder()
                    .setColor(resolveColor("#ff0000"))
                    .setTitle("Guild Only")
                    .setDescription(`>>> You can use this Command only in Guilds`)
            ]
        }).catch(() => null), false;
    }

    if(command.mustPermissions?.length) {
        if(ctx.user.id !== ctx.guild?.ownerId && !ctx?.member?.permissions?.has?.(PermissionFlagsBits.Administrator) && command.mustPermissions.some(x => !ctx?.member?.permissions?.has?.(x)))  {
            return await ctx.reply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setColor(resolveColor("#ff0000"))
                        .setTitle("You need __all__ those Permissions:")
                        .setDescription(`>>> ${new PermissionsBitField(command.mustPermissions).toArray().map(x => `\`${x}\``).join(", ")}`)
                ]
            }).catch(() => null), false;
        }
    }

    if(command.allowedPermissions?.length) {
        if(ctx.user.id !== ctx.guild?.ownerId && !ctx?.member?.permissions?.has?.(PermissionFlagsBits.Administrator) && !command.allowedPermissions.some(x => ctx?.member?.permissions?.has?.(x)))  {
            return await ctx.reply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setColor(resolveColor("#ff0000"))
                        .setTitle("You need one of those Permissions:")
                        .setDescription(`>>> ${new PermissionsBitField(command.allowedPermissions).toArray().map(x => `\`${x}\``).join(", ")}`)
                ]
            }).catch(() => null), false;
        }
    }
    if(!dontCheckCooldown && isOnCooldown(client, command, ctx)) return false;

    return true;
}

/**
 * 
 * @param {import("../structures/BotClient.mjs").BotClient} client 
 * @param {*} command 
 * @param {*} ctx 
 * @returns 
 */
export function isOnCooldown(client, command, ctx) {
    const [ userId, guildId ] = [ ctx.user.id, ctx.guild.id ];
    // ensuring things
    if(!client.cooldowns.user.get(userId)) client.cooldowns.user.set(userId, new Collection());
    if(!client.cooldowns.guild.get(guildId)) client.cooldowns.guild.set(guildId, new Collection());
    if(!client.cooldowns.global.get(userId)) client.cooldowns.global.set(userId, []);
    
    const defaultCooldown =
        cooldownCategoriesHigh.includes(command.category) || cooldownCommandsHigh.includes(command.name)
        ? defaultCooldownMsHigh : 
        cooldownCategories.includes(command.category) || cooldownCommands.includes(command.name)
        ? defaultCooldownMs : 0;
    
    if(command.cooldown?.user) {
        const userCooldowns = client.cooldowns.user.get(userId);
        const commandCooldown = userCooldowns.get(command.name) || 0;
        if(commandCooldown > Date.now()) {
            return ctx.reply({
                ephemeral: true,
                embeds: [
                    new ErrorEmbed(ctx).addField(`${Emoji(ctx).Cooldown.str} Ayo, Commandcooldown`, `> You can use this Command \`${onlySecondDuration(commandCooldown - Date.now())}\``)
                ],
            }).catch(() => null), true;
        }
        userCooldowns.set(command.name, Date.now()+(command.cooldown?.user||0))
        client.cooldowns.user.set(guildId, userCooldowns);
    }
    if(command.cooldown?.guild ?? defaultCooldown) {
        const guildCooldowns = client.cooldowns.guild.get(guildId);
        const commandCooldown = guildCooldowns.get(command.name) || 0;
        if(commandCooldown > Date.now()) {
            return ctx.reply({
                ephemeral: true,
                embeds: [
                    new ErrorEmbed(ctx).addField(`${Emoji(ctx).Cooldown.str} Ayo, Guildcooldown`, `> This Guild can use this Command \`${onlySecondDuration(commandCooldown - Date.now())}\``)
                ],
            }).catch(() => null), true;
        }
        guildCooldowns.set(command.name, Date.now() + (command.cooldown?.guild ?? defaultCooldown))
        client.cooldowns.guild.set(guildId, guildCooldowns);
    }
    const globalCooldowns = client.cooldowns.global.get(userId);
    const allCools = [...globalCooldowns, Date.now()].filter( x => (Date.now() - x) <= maximumCoolDownCommands.time);
    client.cooldowns.global.set(userId, allCools);
    if(allCools.length > maximumCoolDownCommands.amount) {
        return ctx.reply({
            ephemeral: true,
            embeds: [
                new ErrorEmbed(ctx).addField(`${Emoji(ctx).Cooldown.str} Ayo, Slowdown`, `> You only get to use ${maximumCoolDownCommands.amount} Commands per ${maximumCoolDownCommands.time / 1000} Seconds`)
            ],
        }).catch(() => null), true;
    }
    return false;
}