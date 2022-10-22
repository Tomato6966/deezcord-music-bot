import { Manager} from "erela.js";
export class DeezCordClient extends Manager {
    /** @param {import("./BotClient.mjs").BotClient} client */
    constructor(client) {
        super({
            defaultSearchPlatform: "dzsearch",
            validUnresolvedUris: ["deezer.com"],
            volumeDecrementer: 0.75,
            position_update_interval: 100,
            allowedLinksRegexes: [
                /((https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(track|playlist|album|artist)\/(\d+)|(https?:\/\/|)?(?:www\.)?deezer\.page\.link\/(\S+))/
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
                    secure: true,
                }
            ],
            shards: client.cluster.info.TOTAL_SHARDS,
            clientName: "Deezcord",
            send: (i, p) => client?.guilds?.cache.get(i)?.shard?.send?.(p),
        });
        this.client = client;
        this.client.cluster
    }
}