import { ApplicationCommandType, ButtonStyle, ButtonBuilder, ActionRowBuilder } from "discord.js";
import { Embed } from "../structures/Embed.mjs";

/** @type {import("../data/DeezCordTypes.mjs").ContextExport} */
export default {
    name: "deezeraccount",
    type: ApplicationCommandType.User,
    async execute(client, interaction) {
        
        const { deezerToken, deezerId, deezerImage, deezerName } = await client.db.userData.findFirst({
            where: { userId : interaction.targetId }, //select: { deezerToken: true, deezerId: true }
        }).catch(() => {}) || {};

        const embed = new Embed();
        if(deezerToken && deezerId) {
            if(interaction.user.id === interaction.targetId) embed.addField("Deezer accesstoken", `> ||\`${deezerToken}\`||`)
            embed.addField("Deezer profile ID", `> \`${deezerId}\``)
            embed.addField("Deezer profile Display-Name", `> \`${deezerName}\``)
            if(deezerImage) embed.setThumbnail(deezerImage)
        } else embed.addField("Error", `> You are not [logged in] yet\n> For more information see ${client.commands.find(c => c.name == "login")?.mention}`)
        
        await interaction.reply({
            ephemeral: true,
            content: `Here are your Deezer account Informations`,
            embeds: [ embed ],
            components:  deezerId ? [
                new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(`https://www.deezer.com/profile/${deezerId}`).setLabel("Profile-Link").setEmoji(client.DeezEmojis.deezer.parsed))
            ] : []
        });
    }
}