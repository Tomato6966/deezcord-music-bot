import { resolveColor } from "discord.js";
export default {
    mainColorHex: "#c1f1fc",
    mainColor: resolveColor(this.mainColorHex),
                             // pure red, light red, orange, yellow
    errorColorHex: "#FA5807", // "#FF0000" | "#FF3A3A" | "FA2C07" | "#FA5807" 
    errorColor: resolveColor(this.errorColorHex),

    supportServer: "https://discord.gg/7KJnTDKQ8N",
    name: "Deezcord",
    inviteURL: "https://discord.com/oauth2/authorize?client_id=1032998523123290182&scope=bot&permissions=279218310144",
    iconURL: "https://cdn.discordapp.com/avatars/1032998523123290182/83b2c200dbc11dd5e0a96dc83d600b17.webp?size=256",
}
