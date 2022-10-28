import { optionTypes } from "../structures/BotClient.mjs";

/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "seek",
    description: "Seek the current Song",
    category: "music#player",
    options: [
        {
            name: "forward_amount",
            description: "For how many seconds, do you want to seek forwards? (Default 20) [Overwrites rewind]",
            required: false,
            type: optionTypes.number,
            min: 1,
        },
        {
            name: "seek_amount",
            description: "To which second to seek to? [Overwrites forward & rewind]",
            required: false,
            type: optionTypes.number,
            min: 1,
        },
        {
            name: "rewind_amount",
            description: "For how many seconds, do you want to seek backwards?",
            required: false,
            type: optionTypes.number,
            min: 1,
        },
        {
            name: "replay_song",
            description: "Do you want to replay the song? [Overwrites all]",
            required: false,
            type: optionTypes.stringchoices,
            choices: [
                {name: "True", value: "true" },
                {name: "False", value: "false" },
            ]
        }
    ],
    async execute(client, interaction) {
        
        const { player, created, previousQueue } = await client.DeezUtils.track.createPlayer(interaction, interaction.member);
        if(!player) return;
        
        const shouldReplay = interaction.options.getString("replay_song") && interaction.options.getString("replay_song") == "True";
        
        const trackTimeInSec = Math.floor(player.queue.current.duration / 1000)
        const currentPositionInSec = Math.floor(player.position / 1000)

        let time = "null";  
        
        if(shouldReplay) {
            time === 0
        }  else {
            const timeRWD = Number(interaction.options.getNumber("rewind_amount")); 
            if(timeRWD && !isNaN(timeRWD)) time = timeRWD;  
            const timeFWD = Number(interaction.options.getNumber("forward_amount"));   
            if(timeFWD && !isNaN(timeFWD)) time = timeFWD; 
            const timeSEEK = Number(interaction.options.getNumber("seek_amount")); 
            if(timeSEEK && !isNaN(timeSEEK)) time = timeSEEK; 

            if(time === "null") time = currentPositionInSec + 20
            
            if(!shouldReplay && (isNaN(time) || time >= trackTimeInSec || time < 0)) return interaction.reply({
                ephemeral: true,
                content: `${client.DeezEmojis.error.str} Time must be between: \`1\` and \`${trackTimeInSec}\``
            });            
        }
        await player.seek(shouldReplay ? 0 : time * 1000);

        interaction.reply({
            ephemeral: true,
            content: `${client.DeezEmojis.approve.str} Seeked to \`${client.DeezUtils.time.durationFormatted(time, false)}\``
        });
    }
}