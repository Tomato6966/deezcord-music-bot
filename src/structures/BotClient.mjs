import { Client, GatewayIntentBits, Partials, ActivityType, PresenceUpdateStatus, Collection } from "js";
import { getInfo } = from "discord-hybrid-sharding";
import { Second } = from "../utils/TimeUtils"; 
import { promises } = from "fs";
import { join, resolve } from "path";

export class botClient extends Client {
    constructor(options = {}) {
        super({
            ...getDefaultClientOptions(),
            ...options
        });
        this.commands = new Collection();
        this.eventPaths = new Collection();
        this.allCommands = [];
        this.cooldowns = new Collection();
    }
    async loadEvents() {
        const paths = await walks(`${process.cwd()}/events`);
        await Promise.all(
            paths.map(async (path) => {
                const event = await import(resolve(path));
                const splitted = resolve(path).split("/")
                const eventName = splitted.reverse()[0].replace(".js", "");
                this.eventPaths.set(eventName, { eventName, path: resolve(path) });
                this.on(eventName, event.bind(null, this));
            })
        );
        return true;
    }
    async loadCommads() {
        const paths = await walks(`${process.cwd()}/src/commands`);
        await Promise.all(
            paths.map(async (path) => {
                const cmd = await import(resolve(path));
                const splitted = resolve(path).split("/")
                this.commands.set(cmd.name, { ...cmd, category });
            })
        );
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
            GatewayIntentBits.GuildMembers, // for guild members related things
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
        }
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
        })
    }
}


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