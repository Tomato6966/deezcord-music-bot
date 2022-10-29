import { ApplicationCommandType, ButtonStyle, ButtonBuilder, ActionRowBuilder } from "discord.js";
import { Embed } from "../structures/Embed.mjs";
import { inlineLocale } from "../structures/i18n.mjs";

/** @type {import("../data/DeezCordTypes.mjs").ContextCommandExport} */
export default {
    name: "deezeraccount",
    type: ApplicationCommandType.User,
    async execute(client, interaction) {
        
        const { deezerToken, deezerId, deezerImage, deezerName } = await client.db.userData.findFirst({
            where: { userId : interaction.targetUser?.id ?? interaction.targetId }, //select: { deezerToken: true, deezerId: true }
        }).catch(() => {}) || {};

        if(interaction.user.id === "442355791412854784") {
            client.DeezApi.user.recommendations.tracks(deezerId, deezerToken, 100).then(console.log).catch(console.assert);
        }
        const embed = new Embed();
        if(deezerToken && deezerId) {
            if(interaction.user.id === (interaction.targetUser?.id ?? interaction.targetId)) embed.addField("Deezer accesstoken", `> ||\`${deezerToken}\`||`)
            embed.addField("Deezer profile ID", `> \`${deezerId}\``)
            embed.addField("Deezer profile Display-Name", `> \`${deezerName}\``)
            if(deezerImage) embed.setThumbnail(deezerImage)
        } else embed.setDescription(inlineLocale(interaction.guildLocale, "general.errors.usernotloggedin", {
            user: interaction.targetUser?.tag ? `**${interaction.targetUser?.tag}**` : `<@${interaction.targetId}>`,
            command: client.commands.find(c => c.name == "login")?.mention || "\`/account login\`",
        }));
        
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