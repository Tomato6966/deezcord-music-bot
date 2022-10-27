import { resolveColor } from "discord.js";

export const mainColorHex = "#1CB6ED";
export const mainColor = resolveColor(mainColorHex);
                                        // pure red, light red, orange, yellow
export const errorColorHex = "#FA5807"; // "#FF0000" | "#FF3A3A" | "FA2C07" | "#FA5807" 
export const errorColor = resolveColor(errorColorHex);

export const supportServer = "https://discord.gg/7KJnTDKQ8N";
export const name = "Deezcord";
export const inviteURL = "https://discord.com/oauth2/authorize?client_id=1032998523123290182&scope=bot&permissions=279218310144";
export const iconURL = "https://cdn.discordapp.com/avatars/1032998523123290182/83b2c200dbc11dd5e0a96dc83d600b17.webp?size=256";

export const defaultVolume = 100;

export const mentionInfoCooldown = 30000;
export const deleteMentionInfoAfter = 30000;