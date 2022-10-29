import os from 'node-os-utils';

export class DeezCordBotUtils {
    /** @param {import("../BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
        this.botinfoCache = null;
    }
    async receiveBotInfo () {
        try {
            if(this.botinfoCache && this.botinfoCache.validUntil >= Date.now()) return this.botinfoCache;
            const cluster = this.client.cluster.id;
            const shards = this.client.cluster.ids.map(d => `#${d.id}`).join(", ");
            const guilds = this.client.guilds.cache.size;
            const members = this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const memoryUsage = process.memoryUsage();
            const ram = {
                heapTotal: this.formatBytes(memoryUsage.heapTotal),
                heapUsed: this.formatBytes(memoryUsage.heapUsed),
                rss: this.formatBytes(memoryUsage.rss),
                external: this.formatBytes(memoryUsage.external),
                arrayBuffers: this.formatBytes(memoryUsage.arrayBuffers),
            }
            const memory = `${this.formatByteStrings(ram.heapUsed)}/${this.formatByteStrings(ram.rss)}`;
            const ping = this.client.ws.ping;
            const dbPing = await this.getDBPing() || "undefined";
            const CPUUsage = await this.receiveCPUUsage();
            const players = this.client.DeezCord.players.size;
            const uptime = this.client.uptime;
            this.botinfoCache = { 
                cluster, shards, guilds, members, ram, CPUUsage, players, uptime, ping, dbPing, memory, validUntil: Date.now() + 120000
            };
            return this.botinfoCache;
        } catch (e) {
            console.error(e);
            return { cluster: client.cluster.id, e }
        }
    };
    async receiveCPUUsage() {
        return await os.cpu.usage(100);
    }
    async getDBPing() {
        const timeBefore = process.hrtime();
        await this.client.db.guildSettings.findFirst({ take: -1 }).catch(console.warn);
        const timeAfter = process.hrtime(timeBefore);
        return Math.floor((timeAfter[0] * 1000000000 + timeAfter[1]) / 10000) / 100;
    }
    formatBytes(num) {
        return Math.floor(num / 1024 / 1024 * 100) / 100
    }
    formatByteStrings(str) {
        if(!str) return str;
        if(typeof str === "number") str = String(str);
        if(str.endsWith?.("k")) return `${str.replace("k", "")}gb`;
        if(str.endsWith?.("M")) return `${str.replace("M", "")}tb`;
        return `${str}mb`;
    }
}
