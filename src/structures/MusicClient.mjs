import { Manager} from "erela.js";
export class DeezCordClient extends Manager {
    /** @param {import("./BotClient.mjs").BotClient} client */
    constructor(client) {
        super({
            defaultSearchPlatform: "dzsearch",
            validUnresolvedUris: ["deezer.com"],
            volumeDecrementer: 0.75,
            useUnresolvedData: true,
            position_update_interval: 100,
            allowedLinksRegexes: [
                client.regex.DeezerURL
            ],
            nodes: [
                {
                    identifier: "Deezcord-Node",
                    host: process.env.LAVALINK_HOST,
                    port: Number(process.env.LAVALINK_PORT),
                    password: process.env.LAVALINK_PASSWORD,
                    retryAmount: 10,
                    retryDelay: 7500,
                    requestTimeout: 5000,
                    secure: false,
                }
            ],
            shards: client.cluster.info.TOTAL_SHARDS,
            clientName: "Deezcord",
            send: (i, p) => client?.guilds?.cache.get(i)?.shard?.send?.(p),
        });
        this.client = client;
        this.createOptions = { ...this.options };  
    }
}