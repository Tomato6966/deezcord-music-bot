export default {
    DiscordSnowfalke: /^(?<id>\d{17,20})$/,
    DiscordToken: /(?<mfaToken>mfa\.[a-z0-9_-]{20,})|(?<basicToken>[a-z0-9_-]{23,28}\.[a-z0-9_-]{6,7}\.[a-z0-9_-]{27})/i,
    
    DeezerURL: /((https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(track|playlist|album|artist|mixes\/genre|episode)\/(\d+)|(https?:\/\/|)?(?:www\.)?deezer\.page\.link\/(\S+))/,
    GeneralURL: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/,
    apiUrl: /^https?:\/\/\w+(\.\w+)*(:[0-9]+)?(\/.*)?$/,

    Ipv4Address: /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?!$)|$)){4}$/,
    botMention: new RegExp(`^<@!?${process.env.DISCORD_CLIENT_ID}>\\s*`),
}