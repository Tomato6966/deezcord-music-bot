import { optionTypes } from "../structures/BotClient.mjs";
import { i18n, inlineChoicesLocale, inlineLocale, inlineLocalization } from "../structures/i18n.mjs";
import { EQS, bassboost } from "../data/EqualizerDatas.mjs";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";

const toggleFilters = {
    nightcore: (interaction, player) => {
        if(player.get("vaporwave")) {
            player.filterData.timescale.speed = 1;
            player.filterData.timescale.pitch = 1;
            player.filterData.timescale.rate = 1;
            player.filters.nightcore = false; // force nightcore to be active afterwards
            player.set("vaporwave", undefined);
        }
        return player.toggleNightcore(1.289999523162842, 1.289999523162842, 0.9365999523162842);
    },
    rotating: (interaction, player) => {
        return player.toggleRotating()
    },
    tremolo: (interaction, player) => {
        return player.toggleTremolo()
    },
    vibrato: (interaction, player) => {
        return player.toggleVibrato()
    },
    lowPass: (interaction, player) => {
        return player.toggleLowPass()
    },
    karaoke: (interaction, player) => {
        return player.toggleKaraoke()
    },
    audioOutput: (interaction, player, type) => {
        return player.setAudioOutput(type) // 'mono' / 'stereo' / 'left' / 'right'
    },
    echo: (interaction, player) => {
        return player.toggleEcho()
    },
    vaporwave: (interaction, player) => {
        if(player.filters.nightcore == true) {
            player.filterData.timescale.speed = 1;
            player.filterData.timescale.pitch = 1;
            player.filterData.timescale.rate = 1;
            player.filters.nightcore = false;
            player.set("vaporwave", undefined); // force vaporwave to be active afterwards
        } // disable nightcore if active
        
        const active = player.get("vaporwave");
        
        player.set("vaporwave", active ? undefined : true)
        player.filterData.timescale.speed = active ? 1 : 0.8500000238418579;
        player.filterData.timescale.pitch = active ? 1 : 0.800000011920929;
        player.filterData.timescale.rate = 1;
        return player.updatePlayerFilters();
    },
}

const checkFilterStates = {
    nightcore: (interaction, player) => {
        return player.filters.nightcore;
    },
    rotating: (interaction, player) => {
        return player.filters.rotating
    },
    tremolo: (interaction, player) => {
        return player.filters.tremolo
    },
    vibrato: (interaction, player) => {
        return player.filters.vibrato
    },
    lowPass: (interaction, player) => {
        return player.filters.lowPass
    },
    karaoke: (interaction, player) => {
        return player.filters.karaoke
    },
    audioOutput: (interaction, player) => {
        return player.filters.audioOutput !== "stereo" // stereo is default aka disabled
    },
    echo: (interaction, player) => {
        return player.filters.echo
    },
    vaporwave: (interaction, player) => {
        return !!player.get("vaporwave");
    },
}

const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);


const getButtons = (interaction, player, disabled = false) => {
    return Object.keys(toggleFilters).map(id => {
        return new ButtonBuilder()
            .setStyle(checkFilterStates[id](interaction, player) ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setLabel(id === "audioOutput" ? `AudioOutput: ${player.filters.audioOutput}` : capitalizeFirstLetter(id))
            .setCustomId(id)
            .setDisabled(disabled);
    })
}


/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "filters",
    description: inlineLocale("EnglishUS", `songmanipulation.filters.description`),
    localizations: i18n.getLocales().map(locale => inlineLocalization(locale, "filters", "songmanipulation.filters.description")),
    category: "music#player",
    async execute(client, interaction) {
        
        const { player } = await client.DeezUtils.track.createPlayer(interaction, interaction.member, false, { playermustexist: true });
        if(!player) return;
        
        if(!client.DeezUtils.track.isDjAllowed(interaction, interaction.member, "filters", player));
        
        const msg = await interaction.reply({
            ephemeral: true,
            components: client.DeezUtils.array.chunks(getButtons(interaction, player), 5).map(row => new ActionRowBuilder().addComponents(row)).slice(0, 5),
            content: `Currently not finished yet\n> *Click a Button to **toggle or set** a filter*`
        });
        const collector = await msg.createMessageComponentCollector({
            max: 1, time: 60000,
            filter: i => i.user.id === interaction.user.id
        })
        collector.on("collect", i => {
            if(i.customId === "audioOutput") {
                const msg2 = await i.update({
                    components: [
                        new ActionRowBuilder().addComponents([
                            new StringSelectMenuBuilder()
                                .addOptions(["mono", "stereo", "left", "right"].map(x => {
                                    return {
                                        value: x,
                                        label: capitalizeFirstLetter(x),
                                        description: `Only hear the Audio from the ${x} Audio-Output-Channel`
                                    }
                                }))
                                .setCustomId("audioutputpicker")
                                .setDisabled(false).setMaxValues(1).setMinValues(1)
                                .setPlaceholder(`Pick the new Audio-Output, Current: '${player.filters.audioOutput}'`)
                        ])
                    ]
                });
                const collector = await msg2.createMessageComponentCollector({
                    max: 1, time: 60000,
                    filter: i => i.user.id === interaction.user.id
                })
                collector.on("collect", i => {
                    const pickedOutput = i.values[0]; 
                    toggleFilters.audioOutput(interaction, player, pickedOutput); // 'mono' / 'stereo' / 'left' / 'right'
                    return await i.update({
                        content: `Set the Audio Output to: \`${pickedOutput}\``,
                        components: client.DeezUtils.array.chunks(getButtons(interaction, player, true), 5).map(row => new ActionRowBuilder().addComponents(row)).slice(0, 5)
                    })
                })
                collector.on("end", (col) => {
                    if(!col.size) return await i.editReply({
                        content: "Time ran out",
                        components: client.DeezUtils.array.chunks(getButtons(interaction, player, true), 5).map(row => new ActionRowBuilder().addComponents(row)).slice(0, 5)
                    })
                })
                return;
            }
            
            toggleFilters[i.customId](interaction, player);

            return await i.update({
                content: checkFilterStates[i.customId](interaction, player) 
                ? `Enabled the \`${capitalizeFirstLetter(i.customId)}\` Filter`
                : `Disabled the \`${capitalizeFirstLetter(i.customId)}\` Filter`,
                components: client.DeezUtils.array.chunks(getButtons(interaction, player, true), 5).map(row => new ActionRowBuilder().addComponents(row)).slice(0, 5)
            })
        })
        collector.on("end", (col) => {
            if(!col.size) interaction.editReply({
                content: "Time ran out",
                components: client.DeezUtils.array.chunks(getButtons(interaction, player, true), 5).map(row => new ActionRowBuilder().addComponents(row)).slice(0, 5)
            })
        })
        // if (id === "audioOutput") edit --> show drop down --> edit again state 
    }
}