import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

export class DeezCordPermissionUtils {
    /** @param {import("./BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
    }
    
    /**
     * 
     * @param {import("discord.js").GuildMember} me 
     * @param {import("discord.js").Channel} channel 
     * @param {import("discord.js").Collection<string, import("discord.js").Role>} [providedRoles] 
     * @returns {{everyone: import("discord.js").OverwriteData, roles: import("discord.js").OverwriteData[], member: import("discord.js").OverwriteData}}
     */
    getChannelOverwrites(me, channel, providedRoles) {
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
     * @param {import("discord.js").Channel} channel 
     * @param  {...any} perms 
     * @returns 
     */
    checkPermOverwrites(channel, ...perms) {
        const permissions = this.returnOverwrites(channel);
        if(typeof permissions === "boolean") return permissions;
        // if his permission is denied
        return permissions.has(perms)
    }

    /**
     * @param {import("discord.js").Channel} channel 
     * @returns {import("discord.js").PermissionsBitField} permissions
     */
    returnOverwrites(channel) {
        const { me } = channel.guild?.members || {};
        if(me.permissions?.has(PermissionFlagsBits.Administrator)) return true;

        const roles = me.roles.cache;

        let permissions = new PermissionsBitField(roles?.map(role => role.permissions));
        const overwrites = channel?.overwritesFor?.(me, true, roles) || this.getChannelOverwrites(me, channel, roles);

        if(overwrites.everyone?.deny) permissions = permissions.remove(overwrites.everyone?.deny)
        if(overwrites.everyone?.allow) permissions = permissions.add(overwrites.everyone?.allow)
        if(overwrites.roles.length > 0) permissions = permissions.remove(overwrites.roles.map(role => role.deny))
        if(overwrites.roles.length > 0) permissions = permissions.add(overwrites.roles.map(role => role.allow))
        if(overwrites.member?.deny) permissions = permissions.remove(overwrites.member?.deny)
        if(overwrites.member?.allow) permissions = permissions.add(overwrites.member?.allow)
        return permissions;
    }

    /**
     * @param {import("discord.js").Channel} channel 
     * @param {bigint[]} PermissionFlagsBits 
     * @returns {import("discord.js").PermissionsBitField} permissions
     */
    checkPerms(channel, ...PermissionFlagsBits) {
        if(channel?.guild?.members?.me?.permissions?.has(PermissionFlagsBits.Administrator)) return true;
        if(channel?.guild?.members?.me) return this.checkPermOverwrites(channel, ...PermissionFlagsBits);
        return channel?.permissionsFor?.(this.client.user.id)?.has?.([...PermissionFlagsBits.flat()]);
    }
}