import { parseEmoji } from "discord.js";

export default {
    approve: createEmojiObject("✅"),
    deny: createEmojiObject("❌"),
    error: createEmojiObject("❌"),
    skip: createEmojiObject("⏭"),
    ping: createEmojiObject("🏓"),
    uptime: createEmojiObject("🕐"),
}

function createEmojiObject(str) {
    return { str, parsed: parseEmoji(str) }
}