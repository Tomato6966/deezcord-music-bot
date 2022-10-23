import Puppeteer from "puppeteer";

export class DeezCordTrackUtils {
    /** @param {import("../BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
    }

    /** @param {import("discord.js").User|string} requester */
    getRequesterString(requester) {
        return requester?.tag || requester.username || requester?.id || requester || "Requester";
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
            await page.goto(`https://www.deezer.com/de/track/${identifier}`);
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
            return lyrics;
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