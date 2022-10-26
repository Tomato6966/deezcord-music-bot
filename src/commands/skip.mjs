/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "skip",
    description: "Skip a song",
    category: "music#player",
    async execute(client, interaction) {
        
        const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(interaction, interaction.member);
        if(!player) return;
            
        player.stop();
        interaction.reply({
            ephemeral: true,
            content: `⏭️ Skipped`
        })
    }
}