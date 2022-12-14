import { EmbedBuilder } from "@discordjs/builders";
import { mainColor, name, iconURL, inviteURL, errorColor } from "../data/ConfigData.mjs";

export class Embed extends EmbedBuilder {
    constructor(data={}) {
        super({ ...data });
        this.setAuthor({
            name: name,
            url: inviteURL,
            iconURL: iconURL,
        });
        this.setColor(mainColor);
    }
    addField(name, value, inline) {
        return this.addFields({ name: String(name).substring(0, 256), value: String(value).substring(0, 1024), inline: !!inline });
    }
}
export class ErrorEmbed extends EmbedBuilder {
    constructor(data={}){
        super({...data});
        this.setAuthor({
            name: `Error - ${name}`,
            url: inviteURL,
            iconURL: iconURL,
        });
        this.setColor(errorColor)
    }
    addField(name, value, inline) {
        return this.addFields({ name: String(name).substring(0, 256), value: String(value).substring(0, 1024), inline: !!inline });
    }
}