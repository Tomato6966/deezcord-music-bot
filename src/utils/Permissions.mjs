import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

/**
 * 
 * @param {import("discord.js").GuildMember} me 
 * @param {import("discord.js").Channel} channel 
 * @param {import("discord.js").Collection<string, import("discord.js").Role>} [providedRoles] 
 * @returns {{everyone: import("discord.js").OverwriteData, roles: import("discord.js").OverwriteData[], member: import("discord.js").OverwriteData}}
 */
export function getChannelOverwrites(me, channel, providedRoles) {
    if (!me) return [];
    const roles = providedRoles ?? me.roles.cache;
    const roleOverwrites = [];
    let memberOverwrites;
    let everyoneOverwrites;
    const overWrites = [...(channel.permissionOverwrites?.cache?.values?.()||[])];
    if(overWrites.length) {
        for (const overwrite of overWrites) {
          if (overwrite.id === channel.guild.id) {
            everyoneOverwrites = overwrite;
          } else if (roles.has(overwrite.id)) {
            roleOverwrites.push(overwrite);
          } else if (overwrite.id === me.id) {
            memberOverwrites = overwrite;
          }
        }
    }
    return {
      everyone: everyoneOverwrites,
      roles: roleOverwrites,
      member: memberOverwrites,
    };
}

/**
 * if == true | allowed   ---   if === false | denied
 * @param {import("../structures/BotClient.mjs").BotClient} client 
 * @param {import("discord.js").Channel} channel 
 * @param  {...any} perms 
 * @returns 
 */
export function checkPermOverwrites(client, channel, ...perms) {
    const permissions = returnOverwrites(client, channel);
    if(typeof permissions === "boolean") return permissions;
    // if his permission is denied
    return permissions.has(perms)
}

/**
 * 
 * @param {import("../structures/BotClient.mjs").BotClient} client 
 * @param {import("discord.js").Channel} channel 
 * @returns {import("discord.js").PermissionsBitField} permissions
 */
export function returnOverwrites(client, channel) {
    const { me } = channel.guild?.members || {};
    if(me.permissions?.has(PermissionFlagsBits.Administrator)) return true;

    const roles = me.roles.cache;

    let permissions = new PermissionsBitField(roles?.map(role => role.permissions));
    const overwrites = channel?.overwritesFor?.(me, true, roles) || getChannelOverwrites(me, channel, roles);

    if(overwrites.everyone?.deny) permissions = permissions.remove(overwrites.everyone?.deny)
    if(overwrites.everyone?.allow) permissions = permissions.add(overwrites.everyone?.allow)
    if(overwrites.roles.length > 0) permissions = permissions.remove(overwrites.roles.map(role => role.deny))
    if(overwrites.roles.length > 0) permissions = permissions.add(overwrites.roles.map(role => role.allow))
    if(overwrites.member?.deny) permissions = permissions.remove(overwrites.member?.deny)
    if(overwrites.member?.allow) permissions = permissions.add(overwrites.member?.allow)
    return permissions;
}

/**
 * 
 * @param {import("../structures/BotClient.mjs").BotClient} client 
 * @param {import("discord.js").Channel} channel 
 * @param {bigint[]} PermissionFlagsBits 
 * @returns {import("discord.js").PermissionsBitField} permissions
 */
export function checkPerms(client, channel, ...PermissionFlagsBits) {
    if(channel?.guild?.members?.me?.permissions?.has(PermissionFlagsBits.Administrator)) return true;
    if(channel?.guild?.members?.me) return checkPermOverwrites(client, channel, ...PermissionFlagsBits);
    return channel?.permissionsFor?.(client.user.id)?.has?.([...PermissionFlagsBits.flat()]);
}