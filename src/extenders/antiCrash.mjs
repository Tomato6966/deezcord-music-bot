/** @param {import("../structures/BotClient.mjs").BotClient} */
export default (client) => {
    process.on('unhandledRejection', (reason, p) => {
        console.log(' [antiCrash] :: Unhandled Rejection/Catch');
        console.log(reason, p);
    });
    process.on("uncaughtException", (err, origin) => {
        console.log(' [antiCrash] :: Uncaught Exception/Catch');
        console.log(err, origin);
    })
    process.on('uncaughtExceptionMonitor', (err, origin) => {
        console.log(' [antiCrash] :: Uncaught Exception/Catch (MONITOR)');
        console.log(err, origin);
    });
    process.on('multipleResolves', () => {
        //console.log(' [antiCrash] :: Multiple Resolves');
        //console.log(type, promise, reason);
    });
    process.on('SIGINT', () => process.exit());
    process.on('SIGUSR1', () => process.exit());
    process.on('SIGUSR2', () => process.exit());
    process.on("exit", async () => {
        console.log("\n\nEXITING and stopping all PLAYERS\n\n");
        if(!client.DeezCord) return console.error("No deezcord manager");
        for (const guildId of client.DeezCord.players.map(x => x.guild)) {
            try {
                client.DeezCord.options.send(guildId, {"op":4,"d":{"self_deaf":false,"guild_id":guildId,"channel_id":null,"self_mute":false}});
                //client.musicManager.nodes.each(node => node.send({"op": "destroy", guildId}));
            } catch (e) {
                console.error(e);
            }
        }
    })
}