import { Client, GatewayIntentBits, Partials, ActivityType, PresenceUpdateStatus, Collection, Options, SlashCommandAssertions, PermissionsBitField, PermissionFlagsBits, ChannelType, SlashCommandBuilder, ShardClientUtil, ContextMenuCommandBuilder } from "discord.js";
import { ClusterClient, getInfo } from "discord-hybrid-sharding";
import { Second } from "../utils/TimeUtils.mjs"; 
import { promises } from "fs";
import { join, resolve } from "path";
import { color_log, Logger } from "../utils/Logger.mjs";
import { dirSetup } from "../data/SlashCommandDirSetup.mjs";

export class BotClient extends Client {
    constructor(options = {}) {
        super({
            ...getDefaultClientOptions(),
            ...options
        });

        this.commands = new Collection();
        this.eventPaths = new Collection();
        this.cooldowns = {
            user: new Collection(),
            guild: new Collection(),
            global: new Collection()
        };

        this.allCommands = [];
        this.logger = new Logger({ logLevel:0, prefix: "DEEZCORD" });
        this.cluster = new ClusterClient(this);

        this.DeezCache = {
            fetchedApplication: [],
        }
        this.init();
    }
    async init() {
        console.log(`\n${"-=".repeat(40)}-`);
        this.logger.info(`Loading Events`);
        await this.loadEvents();

        console.log(`\n${"-=".repeat(40)}-`);
        this.logger.info(`Loading Commands`);
        await this.loadCommads();

        console.log(`\n${"-=".repeat(40)}-`);
        this.logger.info(`Loading Extenders`);
        await this.loadExtenders();

        return this.emit("DeezCordLoaded", this);
    }
    get guildsAndMembers() {
        return {
            guilds: this.guilds.cache.size,
            members: this.guilds.cache.map(x => x.memberCount).reduce((a,b) => a+b,0)
        }
    }
    async loadExtenders() {
        try {
            const paths = await walks(`${process.cwd()}/src/extenders`);
            await Promise.all(
                paths.map(async (path) => {
                    const extender = await import(resolve(path)).then(x => x.default)
                    this.logger.debug(`✅ Extender Loaded: ${resolve(path).split("/").reverse()[0].replace(".mjs", "").replace(".js", "")}`);
                    return extender(this);
                })
            );
        } catch (e) {
            this.logger.error(e);
        }
        return true;
    }
    async loadEvents() {
        try {
            this.eventPaths.clear();
            const paths = await walks(`${process.cwd()}/src/events`);
            await Promise.all(
                paths.map(async (path) => {
                    const event = await import(resolve(path)).then(x => x.default)
                    const splitted = resolve(path).split("/")
                    const eventName = splitted.reverse()[0].replace(".mjs", "").replace(".js", "");
                    this.eventPaths.set(eventName, { eventName, path: resolve(path) });
                    this.logger.debug(`✅ Event Loaded: ${eventName}`);
                    return this.on(eventName, event.bind(null, this));
                })
            );
        } catch (e) {
            this.logger.error(e);
        }
        return true;
    }
    async loadCommads(path="/src/commands") {
        try {
            this.allCommands = [];
            this.commands.clear();
            const dirs = await promises.readdir(`${process.cwd()}${path}`);
            for(const dir of dirs) {
                // if its a category aka subcommand / groupcommand:
                if (!dir.endsWith(".mjs") && (await promises.lstat(`${process.cwd()}${path}/${dir}/`).catch(() => null))?.isDirectory?.()) {
                    const thisDirSetup = dirSetup.find(x => x.Folder.toLowerCase() === dir.toLowerCase());
                    if (!thisDirSetup) {
                        this.logger.error(`Could not find the DirSetup for ${dir}`);
                        continue;
                    }
                    //Set the SubCommand as a Slash Builder
                    const subSlash = new SlashCommandBuilder().setName(String(thisDirSetup.name).toLowerCase()).setDescription(String(thisDirSetup.description))
                    
                    if(thisDirSetup.defaultPermissions) {
                        subSlash.setDefaultMemberPermissions(thisDirSetup.defaultPermissions);
                    }
                    if(thisDirSetup.dmPermissions) {
                        subSlash.setDefaultMemberPermissions(thisDirSetup.dmPermissions);
                    }
                    if(thisDirSetup.localizations?.length) {
                        for(const localization of thisDirSetup.localizations) {
                            if(localization.name) subSlash.setNameLocalization(localization.name[0], localization.name[1]);
                            if(localization.description) subSlash.setDescriptionLocalization(localization.description[0], localization.description[1]);
                        }
                    }
                    //Now for each file in that subcommand, add a command!
                    const slashCommands = await promises.readdir(`${process.cwd()}${path}/${dir}/`)
                    for (let file of slashCommands) {
                        const curPath = `${process.cwd()}${path}/${dir}/${file}`;
                        // if it's /commands/slash/XYZ/GROUP/cmd.js
                        if ((await promises.lstat(curPath).catch(console.error))?.isDirectory?.()) {
                            const groupPath = curPath;
                            const groupDirSetup = thisDirSetup.groups?.find(x => x.Folder.toLowerCase() == file.toLowerCase())
                            if (!groupDirSetup) {
                                this.logger.error(`Could not find the groupDirSetup for ${dir}/${file}`);
                                continue;
                            }
                            const slashCommands = await promises.readdir(groupPath).then(x => x.filter(v => v.endsWith(".mjs")));
                            if (slashCommands?.length) {
                                const commands = {}
                                for (let sFile of slashCommands) {
                                    const groupCurPath = `${groupPath}/${sFile}`;
                                    commands[sFile] = await import(groupCurPath).then(x => x.default);
                                }
                                subSlash.addSubcommandGroup(Group => {
                                    Group.setName(groupDirSetup.name.toLowerCase()).setDescription(groupDirSetup.description || "Temp_Desc");
                                    if(groupDirSetup.localizations?.length) {
                                        for(const localization of groupDirSetup.localizations) {
                                            if(localization.name) Group.setNameLocalization(localization.name[0], localization.name[1]);
                                            if(localization.description) Group.setDescriptionLocalization(localization.description[0], localization.description[1]);
                                        }
                                    }
                                    // get all slashcommands inside of this group folder
                                    console.log(slashCommands)
                                    for (let sFile of slashCommands) {
                                        const groupCurPath = `${groupPath}/${sFile}`;
                                        const command = commands[sFile];
                                        if (!command.name) {
                                            this.logger.error(`${groupCurPath} not containing a Command-Name`);
                                            continue;
                                        }
                                        Group.addSubcommand(Slash => {
                                            Slash.setName(command.name).setDescription(command.description || "Temp_Desc");
                                            if(command.localizations?.length) {
                                                for(const localization of command.localizations) {
                                                    if(localization.name) Slash.setNameLocalization(localization.name[0], localization.name[1]);
                                                    if(localization.description) Slash.setDescriptionLocalization(localization.description[0], localization.description[1]);
                                                }
                                            }
                                            this.buildOptions(command, Slash)
                                            return Slash;
                                        });
                                        command.commandId = this.DeezCache.fetchedApplication?.find?.(c => c?.name == subSlash.name)?.permissions?.commandId ?? "commandId";
                                        command.slashCommandKey = `/${subSlash.name} ${Group.name} ${command.name}`
                                        command.mention = `<${command.slashCommandKey}:${command.commandId}>`
                                        // FOLDERSTRUCTURE: /commands/slash/XYZ/info/cmd.js
                                        //   CMDKEYEXAMPLE: groupcmd_xyz_info_cmd
                                        // CMDKEYSTRUCTURE: groupcmd_groupName_subName_cmdName
                                        this.logger.debug(`✅ Group Command Loaded: /${groupDirSetup.name} ${thisDirSetup.name} ${command.name}`);
                                        this.commands.set("groupcmd_" + String(groupDirSetup.name).toLowerCase() + "_" + String(thisDirSetup.name).toLowerCase() + "_" + command.name, command)
                                    }
                                    return Group;
                                });
                            }
                        }
                        // if it's /commands/slash/XYZ/cmd.js
                        else {
                            const command = await import(curPath).then(x => x.default);
                            if (!command.name) {
                                this.logger.error(`${curPath} not containing a Command-Name`);
                                continue;
                            }
                            subSlash.addSubcommand(Slash => {
                                Slash.setName(command.name).setDescription(command.description || "Temp_Desc")
                                if(command.localizations?.length) {
                                    for(const localization of command.localizations) {
                                        if(localization.name) Slash.setNameLocalization(localization.name[0], localization.name[1]);
                                        if(localization.description) Slash.setDescriptionLocalization(localization.description[0], localization.description[1]);
                                    }
                                }
                                this.buildOptions(command, Slash)
                                return Slash;
                            });
                            command.commandId = cache?.fetchedApplication?.find?.(c => c?.name == subSlash.name)?.permissions?.commandId ?? "commandId";
                            command.slashCommandKey = `/${subSlash.name} ${command.name}`
                            command.mention = `<${command.slashCommandKey}:${command.commandId}>`
                            // FOLDERSTRUCTURE: /commands/slash/XYZ/cmd.js
                            //   CMDKEYEXAMPLE: subcmd_xyz_cmd
                            // CMDKEYSTRUCTURE: subcmd_subName_cmdName
                            this.logger.debug(`✅ Sub Command Loaded: /${thisDirSetup.name} ${command.name}`);
                            this.commands.set("subcmd_" + String(thisDirSetup.name).toLowerCase() + "_" + command.name, command)
                        }
                    }
                    this.allCommands.push(subSlash.toJSON());
                }
                else {
                    const curPath = `${process.cwd()}${path}/${dir}`;
                    const command = await import(curPath).then(x => x.default);
                    if (!command.name) {
                        this.logger.error(`${curPath} not containing a Command-Name`);
                        continue;
                    }
                    const Slash = new SlashCommandBuilder().setName(command.name).setDescription(command.description || "Temp_Desc");
                    if(command.defaultPermissions) {
                        Slash.setDefaultMemberPermissions(command.defaultPermissions);
                    }
                    if(command.dmPermissions) {
                        Slash.setDefaultMemberPermissions(command.dmPermissions);
                    }
                    if(command.localizations?.length) {
                        for(const localization of command.localizations) {
                            if(localization.name) Slash.setNameLocalization(localization.name[0], localization.name[1]);
                            if(localization.description) Slash.setDescriptionLocalization(localization.description[0], localization.description[1]);
                        }
                    }
                    this.buildOptions(command, Slash);
                    command.commandId = this.DeezCache?.fetchedApplication?.find?.(c => c?.name == command.name)?.permissions?.commandId ?? "commandId";
                    command.slashCommandKey = `/${command.name}`
                    command.mention = `<${command.slashCommandKey}:${command.commandId}>`
                    // FOLDERSTRUCTURE: /commands/slash/cmd.js
                    //   CMDKEYEXAMPLE: slashcmd_cmd
                    // CMDKEYSTRUCTURE: slashcmd_cmdName
                    this.logger.debug(`✅ Slash Command Loaded: /${command.name}`);
                    this.commands.set("slashcmd_" + command.name, command)
                    this.allCommands.push(Slash.toJSON());
                    continue;
                }
            }
        } catch (e) {
            this.logger.error(e);
        }
        return true;
    }
    async loadContextMenu(path="/src/contextmenu/") {
        try {
            const paths = await walks(`${process.cwd()}${path}`);
            for(const file of paths) {
            }
        } catch (e) {
            this.logger.error(e);
        }
        return true;
    }
    async prepareCommands() {
        if(!process.env.CLIENTID) process.env.CLIENTID = this.user.id;
        if(!process.env.BOTNAME) process.env.BOTNAME = this.user.tag
        // on Ready Execute - with 1 second delay for making 100% sure it's ready
        
        const allSlashs = await this.application.commands.fetch(undefined).then(x => [...x.values()]).catch(console.warn) || [...this.application.commands.cache.values()] || [];
        if(allSlashs?.length) {
            this.DeezCache.fetchedApplication = allSlashs;
            for(const [key, value] of [...this.commands.entries()]) {
                if(!value.slashCommandKey) continue;
                const Base = value.slashCommandKey.split(" ")[0].replace("/", "");
                value.commandId = allSlashs.find(c => c.name === Base)?.permissions?.commandId || 0;
                value.mention = value.mention.replace("commandId", value.commandId || "4206966420");
                this.commands.set(key, value)
            }
            this.logger.debug(`✅ Set Command Mentions of: ${allSlashs?.length} Commands`);
        }
        return true;
    }
    async publishCommands(guildId) {
        if(!guildId) {
            if(this.cluster.id !== 0) return;
            await this.application.commands.set(this.allCommands).then(() => {
                this.logger.info(`SLASH-CMDS | Set ${this.commands.size} slashCommands!`)
                this.logger.warn(`Because u are Using Global Settings, it can take up to 1 hour until the Commands are changed!`)
            }).catch(e => {this.logger.error(e);});
            return true;
        }
        const shardId = ShardClientUtil.shardIdForGuildId(guildId, getInfo().TOTAL_SHARDS)
        // cluster 0 executioners
        if(![...this.cluster.ids.keys()].includes(shardId)) return this.logger.warn("CANT UPDATE SLASH COMMANDS - WRONG CLUSTER");
        const guild = this.guilds.cache.get(guildId);
        if(!guild) return this.logger.error("could not find the guild for updating slash commands")
        guild.commands.set(this.allCommands).then(() => {
            this.logger.info(`SLASH-CMDS | Set ${this.commands.size} slashCommands!`)
            this.application.commands.set([]);
        }).catch(this.logger.error);
    }
    buildOptions(command, Slash) {
        if (command.options?.length) {
            /*
                name: "songtitle",
                description: "Title/Link of the Song/Playlist",
                type: "STRING",
                required: true,
            */
            for (const option of command.options) {
                if(option.type.toLowerCase() === optionTypes.attachment) {
                    Slash.addAttachmentOption(op => {
                        op.setName(option.name.toLowerCase())
                        .setDescription(option.description || "TEMP_DESC")
                        .setRequired(!!option.required)
                        if(option.localizations?.length) {
                            for(const localization of option.localizations) {
                                if(localization.name) op.setNameLocalization(localization.name[0], localization.name[1]);
                                if(localization.description) op.setDescriptionLocalization(localization.description[0], localization.description[1]);
                            }
                        }
                        return op;
                    })
                }
                if (option.type.toLowerCase() === optionTypes.channel) {
                    Slash.addChannelOption(op => {
                        op.setName(option.name.toLowerCase())
                        .setDescription(option.description || "TEMP_DESC")
                        .setRequired(!!option.required)
                        if (option.channelTypes) op.addChannelTypes(...option.channelTypes)
                        
                        if(option.localizations?.length) {
                            for(const localization of option.localizations) {
                                if(localization.name) op.setNameLocalization(localization.name[0], localization.name[1]);
                                if(localization.description) op.setDescriptionLocalization(localization.description[0], localization.description[1]);
                            }
                        }
                        return op;
                    });
                }
                else if (option.type.toLowerCase() === optionTypes.number) {
                    Slash.addNumberOption(op => {
                        op.setName(option.name.toLowerCase())
                            .setDescription(option.description || "TEMP_DESC")
                            .setRequired(!!option.required)
                            .setAutocomplete(!!option.autocomplete)
    
                        if(option.localizations?.length) {
                            for(const localization of option.localizations) {
                                if(localization.name) op.setNameLocalization(localization.name[0], localization.name[1]);
                                if(localization.description) op.setDescriptionLocalization(localization.description[0], localization.description[1]);
                            }
                        }
                        if (option.max) op.setMaxValue(option.max)
                        if (option.min) op.setMinValue(option.min)
                        return op;
                    })
                }
                else if (option.type.toLowerCase() === optionTypes.numberchoices) {
                    Slash.addNumberOption(op => {
                        op.setName(option.name.toLowerCase())
                            .setDescription(option.description || "TEMP_DESC")
                            .setRequired(!!option.required)
                            .setAutocomplete(!!option.autocomplete)
    
                        if(option.localizations?.length) {
                            for(const localization of option.localizations) {
                                if(localization.name) op.setNameLocalization(localization.name[0], localization.name[1]);
                                if(localization.description) op.setDescriptionLocalization(localization.description[0], localization.description[1]);
                            }
                        }
                        if (option.choices) op.setChoices(...option.choices)
                        return op;
                    })
                }
                else if (option.type.toLowerCase() === optionTypes.role) {
                    Slash.addRoleOption(op => {
                        op.setName(option.name.toLowerCase())
                            .setDescription(option.description || "TEMP_DESC")
                            .setRequired(!!option.required)
                        if(option.localizations?.length) {
                            for(const localization of option.localizations) {
                                if(localization.name) op.setNameLocalization(localization.name[0], localization.name[1]);
                                if(localization.description) op.setDescriptionLocalization(localization.description[0], localization.description[1]);
                            }
                        }
                        return op;
                    });
                }
                else if (option.type.toLowerCase() === optionTypes.string) {
                    Slash.addStringOption(op => {
                        op.setName(option.name.toLowerCase())
                            .setDescription(option.description || "TEMP_DESC")
                            .setRequired(!!option.required)
                            .setAutocomplete(!!option.autocomplete)
    
                        if(option.localizations?.length) {
                            for(const localization of option.localizations) {
                                if(localization.name) op.setNameLocalization(localization.name[0], localization.name[1]);
                                if(localization.description) op.setDescriptionLocalization(localization.description[0], localization.description[1]);
                            }
                        }
                        if (option.max) op.setMaxLength(option.max)
                        if (option.min) op.setMinLength(option.min)
                        return op;
                    })
                }
                else if (option.type.toLowerCase() === optionTypes.stringchoices) {
                    Slash.addStringOption(op => {
                        op.setName(option.name.toLowerCase())
                            .setDescription(option.description || "TEMP_DESC")
                            .setRequired(!!option.required)
                            .setAutocomplete(!!option.autocomplete)
    
                        if(option.localizations?.length) {
                            for(const localization of option.localizations) {
                                if(localization.name) op.setNameLocalization(localization.name[0], localization.name[1]);
                                if(localization.description) op.setDescriptionLocalization(localization.description[0], localization.description[1]);
                            }
                        }
                        if (option.choices) op.setChoices(...option.choices)
                        return op;
                    });
                }
                else if (option.type.toLowerCase() === optionTypes.user) {
                    Slash.addUserOption(op => {
                        op.setName(option.name.toLowerCase())
                            .setDescription(option.description || "TEMP_DESC")
                            .setRequired(!!option.required)
                        if(option.localizations?.length) {
                            for(const localization of option.localizations) {
                                if(localization.name) op.setNameLocalization(localization.name[0], localization.name[1]);
                                if(localization.description) op.setDescriptionLocalization(localization.description[0], localization.description[1]);
                            }
                        }
                        return op;
                    });
                }
            }
        }
        return true;
    }
}

export function getDefaultClientOptions() {
    return {
        shards: getInfo().SHARD_LIST, // An array of shards that will get spawned
        shardCount: getInfo().TOTAL_SHARDS, // Total number of shards

        partials: [
            //Partials.Channel,
            //Partials.Message,
            //Partials.GuildMember,
            //Partials.ThreadMember,
            //Partials.Reaction,
            //Partials.User,
            //Partials.GuildScheduledEvent,
        ],
        intents: [ // Object.values(GatewayIntentBits).filter(x => !isNaN(x)).reduce((bit, next) => bit |= next, 0) // all bits
            GatewayIntentBits.Guilds, // for guild related things
            //GatewayIntentBits.GuildMembers, // for guild members related things
            //GatewayIntentBits.GuildBans, // for manage guild bans
            //GatewayIntentBits.GuildEmojisAndStickers, // for manage emojis and stickers
            //GatewayIntentBits.GuildIntegrations, // for discord Integrations
            //GatewayIntentBits.GuildWebhooks, // for discord webhooks
            //GatewayIntentBits.GuildInvites, // for guild invite managing
            GatewayIntentBits.GuildVoiceStates, // for voice related things
            //GatewayIntentBits.GuildPresences, // for user presence things
            //GatewayIntentBits.GuildMessages, // for guild messages things
            //GatewayIntentBits.GuildMessageReactions, // for message reactions things
            //GatewayIntentBits.GuildMessageTyping, // for message typing things
            //GatewayIntentBits.DirectMessages, // for dm messages
            //GatewayIntentBits.DirectMessageReactions, // for dm message reaction
            //GatewayIntentBits.DirectMessageTyping, // for dm message typinh
            //GatewayIntentBits.MessageContent, // enable if you need message content things
        ],
        presence: {
            activities: [
                {
                    name: `Booting up`, type: ActivityType.Playing
                }
            ],
            status: PresenceUpdateStatus.Online
        },
        sweepers: {
            messages: {
                interval: Second.Minute(5),
                lifetime: Second.Hour(1),
            }
        },
        makeCache: Options.cacheWithLimits({
            ApplicationCommandManager: {
                maxSize: 0,
            }, // guild.commands.cache
            BaseGuildEmojiManager: {
                maxSize: 0,
            }, // guild.emojis.cache
            GuildBanManager: {
                maxSize: 0,
            }, // guild.bans.cache
            GuildStickerManager: {
                maxSize: 0,
            }, // guild.stickers.cache
            GuildScheduledEventManager: {
                maxSize: 0,
            }, // guild.scheduledEvents.cache
            ReactionUserManager: {
                maxSize: 0,
            }, // reaction.users.cache
            PresenceManager: {
                maxSize: 0,
            }, // guild.presences.cache
            GuildInviteManager: {
                maxSize: 0,
            }, // guild.invites.cache
            ReactionManager: {
                maxSize: 0,
            },
            MessageManager: {
                maxSize: 0,
                //keepOverLimit: (value, key, col) => value.client.user.id === value.author.id, // caching messages, which needs to be cached ourself
            },
        }),
        failIfNotExists: false,
        allowedMentions: {
            parse: [],
            users: [],
            roles: [],
            repliedUser: true,
        }
        
    };
}

export const optionTypes = {
    attachment: "attachment",
    /*
        {
            name: "...",
            description: "...",
            required: false, // optional
            autocomplete: false, //optional,
            type: optionTypes.string,
            max: 1000, //optional,
            min: 1, //optional,
        }
    */
    string: "string",
    /*
        {
            name: "...",
            description: "...",
            required: false, // optional
            autocomplete: false, //optional,
            type: optionTypes.number,
            max: 100, //optional,
            min: 1, //optional,
        }
    */
    number: "number",
    /*
        {
            name: "...",
            description: "...",
            required: false, // optional
            type: optionTypes.role,
        }
    */
    role: "role",
    /*
        {
            name: "...",
            description: "...",
            required: false, // optional
            type: optionTypes.user,
        }
    */
    user: "user",
    /*
        {
            name: "...",
            description: "...",
            required: false, // optional
            channelTypes: [ChannelType.GuildText], //optional,
            type: optionTypes.number,
            max: 100, //optional,
            min: 1, //optional,
        }
    */
    channel: "channel",
    /*
        {
            name: "...",
            description: "...",
            required: false, // optional
            autocomplete: false, //optional,
            type: optionTypes.stringchoices,
            choices: [
                {name: "...", value: "a"},
                {name: "...", value: "b"},
            ]
        }
    */
    stringchoices: "stringchoices",
    /*
        {
            name: "...",
            description: "...",
            required: false, // optional
            autocomplete: false, //optional,
            type: optionTypes.numberchoices,
            choices: [
                {name: "...", value: 1 },
                {name: "...", value: 2 }
            ]
        }
    */
    numberchoices: "numberchoices"
}
export const textBasedCats = [ChannelType.GuildText, ChannelType.AnnouncementThread, ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.GuildCategory, ChannelType.GuildAnnouncement];


async function walks(path, recursive = true) {
    let files = [];
    const items = await promises.readdir(path, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            files = [ ...files, ...(await walks(`${path}/${item.name}`)) ];
        } else if(item.isFile()) {
            files.push(`${path}/${item.name}`);
        }
    }
    return files;
};