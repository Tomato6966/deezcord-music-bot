import { ApplicationCommandType } from "discord.js";
import { Embed } from "../structures/Embed.mjs";

/** @type {import("../data/DeezCordTypes.mjs").ContextExport} */
export default {
    name: "deezeraccount",
    localizations: [
        {name: ["de", "deezeraccount"]}
    ],
    type: ApplicationCommandType.User,
    async execute(client, interaction) {
        
        const { deezerToken, deezerId, deezerTrackList, deezerPictureMedium, deezerName } = await client.db.userData.findFirst({
            where: { userId : interaction.targetId }, //select: { deezerToken: true, deezerId: true }
        }).catch(() => {}) || {};

        const embed = new Embed();
        if(deezerToken && deezerId) {
            if(interaction.user.id === interaction.targetId) embed.addField("Deezer accesstoken", `> ||\`${deezerToken}\`||`)
            embed.addField("Deezer profile ID", `> \`${deezerId}\``)
            embed.addField("Deezer profile Tracklist-URL", `> ${deezerTrackList}`)
            embed.addField("Deezer profile Tracklist-URL", `> ${deezerTrackList}`)
            if(deezerPictureMedium) embed.setThumbnail(deezerPictureMedium)
        } else {
            embed.addField("Error", `> You are not [logged in] yet\n> For more information see ${client.commands.find(c => c.name == "login")?.mention}`)
        }
        await interaction.reply({
            ephemeral: true,
            content: `Here are your Deezer account Informations`,
            embeds: [
            ]
        });
    }
}