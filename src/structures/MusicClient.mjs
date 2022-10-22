import { Manager} from "erela.js";
export class DeezClient extends Manager {
    constructor(options = { }) {
        super({
            nodes: [
                {
                    identifier: "Deezcord-Node",
                    host: process.env.LAVALINK_HOST,
                    port: process.env.LAVALINK_PORT,
                    password: process.env.LAVALINK_PASSWORD,
                    retryAmount: 10,
                    retryDelay: 7500,
                    requestTimeout: 5000,
                    secure: true,
                }
            ],
            shards: options.client.cluster.info.TOTAL_SHARDS,
            clientName: "Deezcord",
            send: (i, p) => options.client?.guilds?.cache.get(i)?.shard?.send?.(p),
        });
        /** @type {import("./BotClient.mjs").BotClient} */
        this.client = options?.client;
    }
}