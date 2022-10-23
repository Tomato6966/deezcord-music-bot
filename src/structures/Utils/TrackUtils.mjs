export class DeezCordTrackUtils {
    /** @param {import("./BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
    }
    
    /** @param {import("discord.js").User|string} requester */
    getRequesterString(requester) {
        return requester?.tag || requester.username || requester?.id || requester || "Requester";
    }

    /**
     * @param {{ title: string, author?: string, identifier: string }} searchOptions
     * @returns {string|null} Lyrics
    */
    async getLyrics(searchOptions) {
        try {
            const { title, author, identifier } = searchOptions;
            const res = await this.client.lyrics.songs.search(`${author ?? ""} ${this.keepLetters(this.modifyTitle(title))}`.trim()).then(async x => {
                return x?.length ? await x[0].lyrics().catch(() => null) : null;
            }).catch(() => null);
            if(res && typeof res === "string") {
                this.client.db.lyrics.upsert({
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