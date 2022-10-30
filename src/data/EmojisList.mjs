import { parseEmoji } from "discord.js";

export default {
    approve: createEmojiObject("✅"),
    deny: createEmojiObject("❌"),
    error: createEmojiObject("❌"),
    skip: createEmojiObject("⏭"),
    ping: createEmojiObject("🏓"),
    uptime: createEmojiObject("🕐"),
    deezer: createEmojiObject("<:Deezer:1035104072396722196>"),
    deezcord: createEmojiObject("<:Deezcord:1034421754577309756>"),
    cooldown: createEmojiObject("🕛"),
    track: createEmojiObject("🎵"),
    artist: createEmojiObject("🎧"),
    album: createEmojiObject("📑"),
    playlist: createEmojiObject("📑"),
    genremix: createEmojiObject("📑"),
    cooldown: createEmojiObject("🕛"),
    autoplayList: createEmojiObject("📑")
}

function createEmojiObject(str) {
    return { str, parsed: parseEmoji(str) }
}