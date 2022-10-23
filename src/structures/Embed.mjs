import { EmbedBuilder } from "@discordjs/builders";
import { resolveColor } from "discord.js";

export class Embed extends EmbedBuilder {
    constructor(data={}) {
        super({ ...data });
        this.setAuthor({
            name: "© Deezcord",
            url: "https://discord.com/oauth2/authorize?client_id=1032998523123290182&scope=bot&permissions=279218310144",
            iconURL: "https://cdn.discordapp.com/avatars/1032998523123290182/8cff58eb2a86f4eb692f137596ae44f5.webp?size=256",
        });
        this.setColor(resolveColor("#c1f1fc"));
    }
    addField(name, value, inline) {
        return this.addFields({ name: String(name).substring(0, 256), value: String(value).substring(0, 1024), inline: !!inline });
    }
}