import Puppeteer from "puppeteer";
import { Embed, ErrorEmbed } from "../Embed.mjs";
import { PermissionFlagsBits } from "discord.js";
export class DeezCordTrackUtils {
    /** @param {import("../BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
    }
    async createPlayer(interaction, { checkVC } = { }) {
        // if no vc return error
        if (!interaction.channel) return interaction.reply({ 
            ephemeral: true, embeds: [ new ErrorEmbed().addField(`Ohno`, `> Please join a Voice Channel first`) ]
        }).catch(console.warn), { player: null };

        let player = this.client.DeezCord.players.get(interaction.guildId);

        // get the missing perms.
        const missingPerms = this.client.DeezUtils.perms.getMissingPerms(this.client, interaction.channel, [PermissionFlagsBits.ViewChannel,  PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.Administrator])
        
        // check for if not in the same voice channel
        if (player && interaction.channel.id !== player.voiceChannel) return interaction.reply({ 
            ephemeral: true, embeds: [ new ErrorEmbed().addField(`Not in same VC`, `> We are not in the same Voice Channel\n> I'm in <#${player.voiceChannel}>`) ]
        }).catch(console.warn), { player: null };
        // check perm for seeing
        if (!player && !missingPerms?.includes?.("ViewChannel")) return interaction.reply({
            ephemeral: true, embeds: [ new ErrorEmbed().addField(`Not Viewable`, `> I can't see your Voice Channel <#${interaction.changed.id}>`) ]
        }).catch(console.warn), { player: null };
        // check perm for connecting
        if (!player && !missingPerms?.includes?.("Connect")) return interaction.reply({
            ephemeral: true, embeds: [ new ErrorEmbed().addField(`Not Connectable`, `> I can't join your Voice Channel <#${interaction.changed.id}>`) ]
        }).catch(console.warn), { player: null };
        // check perm for speaking
        if (!player && !missingPerms?.includes?.("Speak")) return interaction.reply({
            ephemeral: true, embeds: [ new ErrorEmbed().addField(`Not Speakable`, `> I can't speak in your Voice Channel <#${interaction.changed.id}>`) ]
        }).catch(console.warn), { player: null };
        // check for if the channel is full
        if (!player && interaction.channel.full && !(missingPerms?.includes?.("Administrator") || missingPerms?.includes?.("MoveMembers"))) return interaction.reply({
            ephemeral: true, embeds: [ new ErrorEmbed().addField(`Vc is full`, `> There is no space left in your Voice Channel`) ]
        }).catch(console.warn), { player: null };

        const created = !player;
        const previousQueue = player?.queue?.totalSize ?? 0;

        // create player if not existing
        if (!player) {
            player = this.client.DeezCord.create({
                region: interaction.member.voice.channel?.rtcRegion || undefined,
                guild: interaction.guildId,
                voiceChannel: interaction.member.voice.channel.id, 
                textChannel: interaction.channel.id,
                selfDeafen: true,
            });
            player.connect();
            player.stop();
        }
        
        // re-connect not existing nodes
        const notConnectedNodes = this.client.DeezCord.nodes.filter(n => n.connected);
        if(notConnectedNodes.length) {
            for(const node of notConnectedNodes) await node.connect();
            await this.client.DeezUtils.time.delay(500 * notConnectedNodes.length);
        }

        // return the datas
        return { player, created, previousQueue };
    }
    /**
     * 
     * @param {import("erela.js").Player} player 
     * @param {import("erela.js").Track} track 
     * @returns 
     */
    handleEnd(player, track) {
        if(!player.get("previous")) player.set("previous", [])
        const previousTracks = player.get("previous");
        if(!player.get("previousPlay") && (!previousTracks[0] || previousTracks[0]?.identifier !== track.identifier)) {
            previousTracks.unshift(track);
            if(previousTracks.length > 25) previousTracks.pop(); // limit the previous Tracks amount
            player.set("previous", previousTracks);
        }
        return player.set("previousPlay", undefined);
    }
    /** @param {import("discord.js").User|string} requester */
    getRequesterString(requester) {
        return requester?.tag || requester?.username || requester?.id || requester || "Requester";
    }
    /**
     * @typedef {{line:string|null, lrc_timestamp?:string, milliseconds?:string, duration?:string}} lyricsSincObject
     *
     * @param {{ title: string, author?: string, identifier: string }} searchOptions 
     * @returns {{ LYRICS_ID:string, LYRICS_SYNC_JSON: lyricsSincObject[], LYRICS_TEXT: string, LYRICS_WRITERS: string, LYRICS_COPYRIGHTS: string }|null}
     */
    async getLyricsOfDeezer(searchOptions) {
        try {
            const { title, author, identifier } = searchOptions;

            const browser = await Puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox']
            });
            const page = await browser.newPage();
            await page.goto(`https://deezer.com/track/${identifier}`, {  
              waitUntil: 'networkidle0',
              timeout: 5000,
            });
            const songData = await page.evaluate("__DZR_APP_STATE__");
            await browser.close();
            const lyrics = songData.LYRICS;
            if(!lyrics) return null;

            let JSONSTRING = "";
            try {
                JSONSTRING = JSON.stringify(lyrics.LYRICS_SYNC_JSON)
            } catch(e) {
                JSONSTRING = JSON.stringify(["no-data"]);
            }
            await this.client.db.deezerLyrics.upsert({
                where: { trackId: String(identifier), },
                update: { 
                    LYRICS_ID: String(lyrics.LYRICS_ID),
                    LYRICS_TEXT: String(lyrics.LYRICS_TEXT),
                    LYRICS_WRITERS: String(lyrics.LYRICS_WRITERS),
                    LYRICS_COPYRIGHTS: String(lyrics.LYRICS_COPYRIGHTS),
                    LYRICS_SYNC_JSON: JSONSTRING,
                },
                create: {
                    trackId: String(identifier),
                    title: String(title),
                    author: String(author),
                    LYRICS_ID: String(lyrics.LYRICS_ID),
                    LYRICS_TEXT: String(lyrics.LYRICS_TEXT),
                    LYRICS_WRITERS: String(lyrics.LYRICS_WRITERS),
                    LYRICS_COPYRIGHTS: String(lyrics.LYRICS_COPYRIGHTS),
                    LYRICS_SYNC_JSON: JSONSTRING,
                }
            }).catch(console.error)

            
            return lyrics;
        } catch(e) {
            console.error(e);
            return null;
        }
    }

    /**
     * @param {{ title: string, author?: string, identifier: string }} searchOptions
     * @returns {string|null} Lyrics
    */
    async getLyricsOfGenius(searchOptions) {
        try {
            const { title, author, identifier } = searchOptions;
            const res = await this.client.lyrics.songs.search(`${author ?? ""} ${this.keepLetters(this.modifyTitle(title))}`.trim()).then(async x => {
                return x?.length ? await x[0].lyrics().catch(() => null) : null;
            }).catch(() => null);
            if(!res) console.error("found nothing on genius for:", `${author ?? ""} ${this.keepLetters(this.modifyTitle(title))}`.trim())
            if(res && typeof res === "string") {
                await this.client.db.lyrics.upsert({
                    where: {
                        trackId: String(identifier),
                    },
                    update: {
                        lyrics: String(res)
                    },
                    create: {
                        trackId: String(identifier),
                        title: String(title),
                        author: String(author),
                        lyrics: String(res)
                    }
                }).catch(console.error)
            } 
            return res;
        } catch (e) {
            return null;
        }
    }
    /** @param {string} str */
    modifyTitle (str) {
        const matchBlocks = [
            /\(official Video\)/gmi, /\(officialVideo\)/gmi,
            /\[official Video\]/gmi, /\[officialVideo\]/gmi,
            /\{official Video\}/gmi, /\{officialVideo\}/gmi,
            /official Video/gmi, /officialVideo/gmi,
            /\(official Music Video\)/gmi, /\(officialMusicVideo\)/gmi,
            /\[official Music Video\]/gmi, /\[officialMusicVideo\]/gmi,
            /\{official Music Video\}/gmi, /\{officialMusicVideo\}/gmi,
            /official Music Video/gmi, /officialMusicVideo/gmi,
            /\(official MusicVideo\)/gmi, /\(officialMusic Video\)/gmi,
            /\[official MusicVideo\]/gmi, /\[officialMusic Video\]/gmi,
            /\{official MusicVideo\}/gmi, /\{officialMusic Video\}/gmi,
            /official MusicVideo/gmi, /officialMusic Video/gmi,
        
            /\{Radio Version\}/gmi, /\{RadioVersion\}/gmi,
            /\[Radio Version\]/gmi, /\{RadioVersion\]/gmi,
            /\(Radio Version\)/gmi, /\(RadioVersion\)/gmi,
            /Radio Version/gmi, /RadioVersion/gmi,
            /\{Radio Edit\}/gmi, /\{RadioEdit\}/gmi,
            /\[Radio Edit\]/gmi, /\{RadioEdit\]/gmi,
            /\(Radio Edit\)/gmi, /\(RadioEdit\)/gmi,
            /Radio Edit/gmi, /RadioEdit/gmi,
        
            /\(Karaoke Version\)/gmi, /\(KaraokeVersion\)/gmi,
            /\[Karaoke Version\]/gmi, /\[KaraokeVersion\]/gmi,
            /\{Karaoke Version\}/gmi, /\{KaraokeVersion\}/gmi,
            /Karaoke Version/gmi, /KaraokeVersion/gmi,
        
            /\(Remastered\)/gmi, /\{Remastered\}/gmi, /\[Remastered\]/gmi, /Remastered/gmi,
        
            /\(Lyrics\)/gmi, /\[Lyrics\]/gmi, /\{Lyrics\}/gmi, /Lyrics/gmi,
            /\(Remix\)/gmi, /\[Remix\]/gmi, /\{Remix\}/gmi, /Remix/gmi,
        ];
        for(const block of matchBlocks) str = str.replace(block, "");
        return str.trim().split(" ").filter(x => !!x && x.length).join(" ")
    }

    /** @param {string} str */
    keepLetters (str) {
        return str.replace(/[^a-z\d ]+/igm, "");
    }
}