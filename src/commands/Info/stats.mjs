import { Embed } from "../../structures/Embed.mjs";
import { i18n, inlineLocale, inlineLocalization } from "../../structures/i18n.mjs";

/** @type {import("../../data/DeezCordTypes.mjs").CommandExport} */
export default {
    name: "stats",
    description: inlineLocale("EnglishUS", `info.stats.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "stats", "info.stats.description")),
    category: "info",
    async execute(client, interaction) {
        const thisStats = await client.DeezUtils.bot.receiveBotInfo();
        /** @type {thisStats[]} */
        const totalData = await client.cluster.broadcastEval("DeezUtils.bot.receiveBotInfo()", { timeout: 10000 }).catch(() => null) || [thisStats];
        
        await interaction.reply({
            ephemeral: true,
            embeds: [
                new Embed()
                    .setAuthor({
                        name: `${client.user.tag}`,
                        url: client.configData.inviteURL,
                        iconURL: client.user.displayAvatarURL()
                    })
                    .setFooter({
                        text: `${interaction.guild.name} - Cluster #${client.cluster.id} (Shard: #${interaction.guild.shardId})`,
                        iconURL: interaction.guild.iconURL()
                    })
                    .addField(inlineLocale(interaction.guildLocale, `info.stats.execute.names.cluster`), `>>> \`\`\`yml\n${client.cluster.info.CLUSTER_COUNT}\n\`\`\``, true)
                    .addField(inlineLocale(interaction.guildLocale, `info.stats.execute.names.shards`), `>>> \`\`\`yml\n${client.cluster.info.TOTAL_SHARDS}\n\`\`\``, true)
                    .addField(inlineLocale(interaction.guildLocale, `info.stats.execute.names.ping`), `>>> \`\`\`yml\n${client.ws.ping}ms\n\`\`\``, true)
                    .addField(inlineLocale(interaction.guildLocale, `info.stats.execute.names.uptime`), `>>> ${inlineLocale(interaction.guildLocale, `info.uptime.execute.content`, {
                        time: Math.floor((Date.now() + client.uptime) / 1000),
                    })}`)
                    .addField(inlineLocale(interaction.guildLocale, `info.stats.execute.names.guilds`), `>>> \`\`\`yml\n${totalData.map(x => x.guilds).reduce((a,b) => a + b, 0)}\n\`\`\``, true)
                    .addField(inlineLocale(interaction.guildLocale, `info.stats.execute.names.members`), `>>> \`\`\`yml\n${totalData.map(x => x.members).reduce((a,b) => a + b, 0)}\n\`\`\``, true)
                    .addField(inlineLocale(interaction.guildLocale, `info.stats.execute.names.players`), `>>> \`\`\`yml\n${totalData.map(x => x.players).reduce((a,b) => a + b, 0)}\n\`\`\``, true)
                    .addField(inlineLocale(interaction.guildLocale, `info.stats.execute.names.ram`), `>>> \`\`\`yml\n${totalData.map(x => x.ram?.heapUsed).reduce((a,b) => a + b, 0)}mb / ${totalData.map(x => x.ram?.rss).reduce((a,b) => a + b, 0)}mb\n\`\`\``, true)
                    .addField(inlineLocale(interaction.guildLocale, `info.stats.execute.names.cpu`), `>>> \`\`\`yml\n${thisStats.CPUUsage}%\n\`\`\``, true)
                ]
        });
    }
}