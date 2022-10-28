import { optionTypes } from "../structures/BotClient.mjs";

/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "autoplay",
    description: "Toggle autoplaying recommendations",
    category: "music#player",
    options: [
        {
            name: "add_tracks_per_fetch",
            description: "How many tracks to add, per each Autoplay-fetch. (Default: 5)",
            required: false,
            type: optionTypes.number,
            min: 1,
            max: 5,
        }
    ],
    async execute(client, interaction) {
        
        const { deezerToken: accessToken, deezerId } = await client.db.userData.findFirst({
            where: { userId : interaction.user.id }, select: { deezerToken: true, deezerId: true }
        }).catch(() => {}) || {};

        if(!accessToken || !deezerId) {
            return await interaction.reply({
                ephemeral: true,
                content: inlineLocale(client.getGuildLocale(interaction.guild), "general.errors.usernotloggedin", {
                    user: `<@${interaction.user.id}>`,
                    command: client.commands.find(c => c.name == "login")?.mention || "\`/account login\`",
                })
            })
        }

        if(accessToken) interaction.user.accessToken = accessToken; 
        if(deezerId) interaction.user.deezerId = deezerId; 

        const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(interaction, interaction.member);
        if(!player) return;

        const addTracksPerFetch = Number(interaction.options.getNumber("add_tracks_per_fetch"));
        let addTracksPerAutoplayFetchAmount = addTracksPerFetch && !isNaN(addTracksPerFetch) ? addTracksPerFetch : client.configData.addTracksPerAutoplayFetchAmount;
        
        const autoplays = player.get("autoplay") || [];
        const index = autoplays.findIndex(x => x.userId === interaction.user.id)
        if(index >= 0) {
            autoplays.splice(index, 1);
            player.set("autoplay", autoplays);
            return await interaction.reply({
                ephemeral: true,
                content: `${client.DeezEmojis.approve.str} Turned autoplay from your recommendations off.`
            })
        }
        autoplays.push({ userId: interaction.user.id, deezerId, accessToken, addTracksPerAutoplayFetchAmount });
        
        player.set("autoplay", autoplays);

        interaction.reply({
            ephemeral: true,
            content: `${client.DeezEmojis.approve.str} Autoplay enabled\n> Now playing __your__ recommended Tracks, __if__ the __last played Track__ was requested by __you__.`
        })
    }
}