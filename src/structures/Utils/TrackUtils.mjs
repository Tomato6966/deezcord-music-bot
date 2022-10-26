import Puppeteer from "puppeteer";
import { Embed, ErrorEmbed } from "../Embed.mjs";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, parseEmoji, PermissionFlagsBits } from "discord.js";
import * as configData from "../../data/ConfigData.mjs"

export class DeezCordTrackUtils {
    /** @param {import("../BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
    }
    /**
     * 
     * @param {*} interaction 
     * @param {*} member 
     * @param {*} editReply 
     * @returns {{ player: import("erela.js").Player|null, created: boolean, previousQueue: number }}
     */
    async createPlayer(interaction, member, editReply) {
        const fn = async (...params) => interaction.replied ? await interaction[editReply ? "editReply" : "followUp"](...params).catch(console.warn) : await interaction.reply(...params).catch(console.warn)
        // if no vc return error
        if (!interaction.channel) return await fn({
            ephemeral: true, embeds: [new ErrorEmbed().addField(`Ohno`, `> Please join a Voice Channel first`)]
        }), { player: null };

        let player = this.client.DeezCord.players.get(interaction.guildId);

        // get the missing perms.
        const missingPerms = this.client.DeezUtils.perms.getMissingPerms(this.client, interaction.channel, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.Administrator])

        member = member || interaction.member;

        // check for if not in the same voice channel
        if (player && member?.voice?.channel?.id !== player.voiceChannel) return await fn({
            ephemeral: true, embeds: [new ErrorEmbed().addField(`Not in same VC`, `> We are not in the same Voice Channel\n> I'm in <#${player.voiceChannel}>`)]
        }), { player: null };
        // check perm for seeing
        if (!player && missingPerms?.includes?.("ViewChannel")) return await fn({
            ephemeral: true, embeds: [new ErrorEmbed().addField(`Not Viewable`, `> I can't see your Voice Channel <#${interaction.channel.id}>`)]
        }), { player: null };
        // check perm for connecting
        if (!player && missingPerms?.includes?.("Connect")) return await fn({
            ephemeral: true, embeds: [new ErrorEmbed().addField(`Not Connectable`, `> I can't join your Voice Channel <#${interaction.channel.id}>`)]
        }), { player: null };
        // check perm for speaking
        if (!player && missingPerms?.includes?.("Speak")) return await fn({
            ephemeral: true, embeds: [new ErrorEmbed().addField(`Not Speakable`, `> I can't speak in your Voice Channel <#${interaction.channel.id}>`)]
        }), { player: null };
        // check for if the channel is full
        if (!player && interaction.channel.full && !missingPerms?.includes?.("Administrator") && !missingPerms?.includes?.("MoveMembers")) return await fn({
            ephemeral: true, embeds: [new ErrorEmbed().addField(`Vc is full`, `> There is no space left in your Voice Channel`)]
        }), { player: null };

        const created = !player;
        const previousQueue = player?.queue?.totalSize ?? 0;

        // create player if not existing
        if (!player) {
            player = this.client.DeezCord.create({
                region: member.voice.channel?.rtcRegion || undefined,
                guild: interaction.guildId,
                voiceChannel: member.voice.channel.id,
                textChannel: interaction.channel.id,
                selfDeafen: true,
            });
            player.connect();
            player.stop();
        }

        // re-connect not existing nodes
        const notConnectedNodes = this.client.DeezCord.nodes.filter(n => n.connected);
        if (notConnectedNodes.length) {
            for (const node of notConnectedNodes) await node.connect();
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
        if (!player.get("previous")) player.set("previous", [])
        const previousTracks = player.get("previous");
        if (!player.get("previousPlay") && (!previousTracks[0] || previousTracks[0]?.identifier !== track.identifier)) {
            previousTracks.unshift(track);
            if (previousTracks.length > 25) previousTracks.pop(); // limit the previous Tracks amount
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
            await page.goto(`https://www.deezer.com/track/${identifier}`, {
                waitUntil: 'networkidle0',
                timeout: 5000,
            });
            const songData = await page.evaluate("__DZR_APP_STATE__");
            await browser.close();
            const lyrics = songData.LYRICS;
            if (!lyrics) return null;

            let JSONSTRING = "";
            try {
                JSONSTRING = JSON.stringify(lyrics.LYRICS_SYNC_JSON)
            } catch (e) {
                JSONSTRING = JSON.stringify(["no-data"]);
            }
            if(!JSONSTRING) JSONSTRING = JSON.stringify(["no-data"]);
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
        } catch (e) {
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
            if (!res) console.error("found nothing on genius for:", `${author ?? ""} ${this.keepLetters(this.modifyTitle(title))}`.trim())
            if (res && typeof res === "string") {
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
    modifyTitle(str) {
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
        for (const block of matchBlocks) str = str.replace(block, "");
        return str.trim().split(" ").filter(x => !!x && x.length).join(" ")
    }

    /** @param {string} str */
    keepLetters(str) {
        return str.replace(/[^a-z\d ]+/igm, "");
    }
    /**
     * @typedef { { id:string, name:string, link:string, image:string, albums:string, fans:string } } authorDataType
     * @typedef { { id:string, name:string, type:string } } creatorDataType
     * @typedef { { id?:string, name?:string, description?:string, isLoved?:boolean, link?:string, image?:string, tracks: any[], tracks?:number, duration?:number, fans?:string, releasedAt?:string, creator?: creatorDataType, __createdByDeezCord?: boolean }|undefined } playlistDataType
     * @typedef { { id?:string, name?:string, label?:string, link?:string, image?:string, genres?:string[], tracks?:number, duration?:number, fans?:string, releasedAt?:string, contributors: [authorDataType], artist?: authorDataType, __createdByDeezCord?: boolean }|undefined } albumDataType
     * @typedef { { title:string, author:string, isrc?:string, rank?:string, preview?:string, authorData: authorDataType, thumbnail: string, uri: string, identifier: string, duration?: number, playlistData?: playlistDataType, albumData?: albumDataType } } DeezUnresolvedDataType
     */
    /**
     * 
     * @param {*} data 
     * @returns {albumDataType}
     */
    createAlbumData(data) {
        if(!data || typeof data !== "object") return undefined;
        if(data.__createdByDeezCord) return data;
        return { // e.g. datas: https://www.deezer.com/album/7573078
            id: data.id, // 7573078
            name: data.title || data.name, // Abba Gold Anniversary Edition
            label: data.label,
            link: data.link ?? data.share ?? data.id ? `https://www.deezer.com/album/${data.id}` : undefined, // https://www.deezer.com/album/7573078
            image: this.getAlbumImage(data),
            genres: data.genres?.map?.(x => this.createGenreData(x)) || this.createGenreData(data.genre_id), // [ { id: 132, name: "Pop" } ]
            tracks: data.nb_tracks ?? data.tracks?.length, // 59
            duration: data.duration && !isNaN(data.duration) ? data.duration * 1000 : [...(data.tracks||[])].reduce?.((a,b) => a+b,0) || 0, // 13801000
            fans: data.fans ?? data.nb_fans, // 221159
            releasedAt: data.release_date, // 2014-01-01
            contributors: data?.contributors?.map?.(x => this.parseAuthorData({ artist: x })), // [{ id, name, link, image, albums, fans }]
            artist: this.parseAuthorData({ artist: data.artist }), // { id, name, link, image, albums, fans }
            __createdByDeezCord: true,
        }
    }
    getAlbumImage(data) {
        if(!data || typeof data !== "object") return undefined;
        return data.cover_big ?? data.cover_xl ?? data.cover_medium ?? data.cover_small ?? ((data.md5_image && data.md5_image != "undefined" && data.link?.includes("album/")) ? `https://e-cdns-images.dzcdn.net/images/cover/${data.md5_image}/500x500.jpg` : undefined);
    }  
    getUserImage(data) {
        if(!data || typeof data !== "object") return undefined;
        const image = data.picture_big ?? data.picture_xl ?? data.picture_medium ?? data.picture_small ?? ((data.md5_image && data.md5_image != "undefined" && data.link?.includes("profile/")) ? `https://e-cdns-images.dzcdn.net/images/user/${data.md5_image}/500x500.jpg` : undefined);
        if(image && image.split("user")[1].startsWith("//")) return undefined;
        return image;
    }
    /**
     * 
     * @param {any} data 
     * @returns {playlistDataType}
     */
    createPlaylistData(data) {
        if(!data || typeof data !== "object") return undefined;
        if(data.__createdByDeezCord) return data;
        return {// e.g. datas: https://api.deezer.com/playlist/7249110724
            id: data.id, // 7249110724
            name: data.title || data.name, // Abba Gold Anniversary Edition
            description: data.description,
            isLoved: data.is_loved_track,
            link: data.link ?? data.share ?? data.id ? `https://www.deezer.com/playlist/${data.id}` : undefined, // https://www.deezer.com/playlist/7249110724
            image: this.getPlaylistImage(data),
            tracks: data.nb_tracks ?? data.tracks?.length, // 59
            duration: data.duration && !isNaN(data.duration) ? data.duration * 1000 : [...(data?.tracks?.data||data?.tracks||[])].reduce?.((a,b) => a+b,0) || 0, // 13801000
            fans: data.fans ?? data.nb_fans, // 221159
            releasedAt: data.creation_date, // 2014-01-01
            creator: this.createCreatorData(data.creator), // { id, name, link, image, albums, fans }
            __createdByDeezCord: true,
        }
    }
    /**
     * 
     * @param {any} data 
     * @returns {creatorDataType}
     */
    createCreatorData(data) {
        if(!data || typeof data !== "object") return undefined;
        return {
            id: data.id,
            name: data.name,
            type: data.type,
        }
    }
    getPlaylistImage(data) {
        if(!data || typeof data !== "object") return undefined;
        return data.picture_big ?? data.picture_xl ?? data.picture_medium ?? data.picture_small ?? ((data.md5_image && data.md5_image != "undefined" && data.link?.includes("playlist/")) ? `https://e-cdns-images.dzcdn.net/images/playlist/${data.md5_image}/500x500.jpg` : undefined);
    }
    getGeneralImage(data) {
        if(!data || typeof data !== "object") return undefined;
        return (data?.image?.endsWith?.(".jpg") || data?.image?.endsWith?.(".png")) ? data.image : (this.getAlbumImage(data) || this.getPlaylistImage(data));
    }
    createGenreData(data) {
        if(!data || typeof data !== "object") return undefined;
        return {
            id: data.id,
            name: data.name,
            // image: data.picture,
        }
    }
    /**
     * 
     * @param {any} v 
     * @param {playlistDataType} playlistData 
     * @param {albumDataType} albumData 
     * @returns {DeezUnresolvedDataType}
     */
    createUnresolvedData(v, playlistData, albumData) {
        const artist = this.parseAuthorData(v);
        const o = {
            title: v.title || v.name,
            author: artist.name,
            authorData: {
                id: artist.id,
                name: artist.name,
                link: artist.link,
                image: artist.image,
                nb_album: artist.albums,
                nb_fan: artist.fans
            },
            thumbnail: v.md5_image ? `https://cdns-images.dzcdn.net/images/cover/${v.md5_image}/500x500.jpg` : undefined,
            uri: v.link ?? `https://www.deezer.com/track/${v.id}`,
            identifier: v.id,
            duration: v.duration * 1000,
            playlistData: this.createPlaylistData(playlistData) || null,
            albumData: this.createAlbumData(albumData) || null,
        };
        if(v.isrc) o.irsc = v.isrc;
        if(v.rank) o.rank = v.rank;
        if(v.preview) o.preview = v.preview;
        return o;
    }
    async fetchAuthorData(v) {
        if (!v) return { id: null, name: null, link: null, image: null, albums: null, fans: null }
        if (typeof v === "string" && isNaN(v)) return { id: null, name: v, link: null, image: null, albums: null, fans: null }
        const res = this.parseAuthorData({ artist: v?.artist ?? v?.contributors?.[0]?.id ?? v });
        if (!Object.values(res).filter(x => !x).length) return res;
        const authorId = res?.id || v?.artist?.id || v?.contributors?.[0]?.id;
        const author = await this.client.DeezApi.deezer.fetch.artist(authorId, false);
        return this.parseAuthorData({ artist: Object.assign({}, res, author) });
    }
    parseAuthorData(v) {
        if (typeof v === "string" && isNaN(v)) return { id: null, name: v, link: null, image: null, albums: null, fans: null }
        let [id, name, link, image, albums, fans] = new Array(6).fill(null);
        if (!v) return { id, name, link, image, albums, fans }

        if (v?.artist) {
            if (!id && v.artist.id) id = v.artist.id;

            if (!name && v.artist.name?.length) name = v.artist.name;
            else if (!name && v.artist.title?.length) name = v.artist.title;


            if (!link && v.artist.link?.length) link = v.artist.link;
            else if (!link && v.artist.share?.length) link = v.artist.share;

            if(!image) image = this.getGeneralImage(v.artist);

            if (!albums && v.artist.nb_album) albums = v.artist.nb_album;

            if (!fans && v.artist.nb_fan) fans = v.artist.nb_fan;
        }

        if ((!name || !image || !link) && v?.contributors?.length) {
            let thecontributer = v?.contributors[0];
            if (id || v.artist) thecontributer = v?.contributors?.find?.(x => x?.id == id || x?.id == v.artist?.id) || thecontributer;

            if (thecontributer.id && (!id || thecontributer.id !== id)) id = thecontributer.id;

            if (!name && thecontributer.name?.length) name = thecontributer.name;
            else if (!name && thecontributer.title?.length) name = thecontributer.title;

            if (!link && thecontributer.link?.length) link = thecontributer.link;
            else if (!link && thecontributer.share?.length) link = thecontributer.share;

            if(!image) image = this.getGeneralImage(thecontributer);

            if (!albums && thecontributer.nb_album) albums = thecontributer.nb_album;

            if (!fans && thecontributer.nb_fan) fans = thecontributer.nb_fan;
        }

        if (!link && id) link = `https://www.deezer.com/artist/${v.artist.id}`;

        return { id, name, link, image, albums, fans };
    }

    async transformMessageData(data, tracks, type, enqueued = false, player, extras = {}) {
        const { skipSong, addSongToTop } = extras;
        if(["PLAYLIST_LOADED", "playlist", "playlists"].includes(type)) {
            if(!data.tracks) data.tracks = tracks;
            const plData = this.createPlaylistData(data);
            const plImg = plData.image;
            const plName = plData?.name || plData?.title || "No-Title";
            const plDescription = plData?.description || "No-Description";
            const plLink = plData?.link || "https://www.deezer.com"; 
            const plCreator = plData.creator?.id ? this.client.DeezApi.parseUserData(await this.client.DeezApi.user.data(plData.creator?.id).catch(() => plData.creator)) : null;
            const plAuthorData = data.authorData || await this.client.DeezUtils.track.fetchAuthorData(data?.artist || tracks?.filter?.(v => v?.authorData)?.[0]?.authorData);
            const plRelease = plData.releasedAt;

            const trackDurationNum = this.client.DeezUtils.array.sumNumbersOnly(tracks, x => x.duration);
            const trackDurationString = trackDurationNum ? this.client.DeezUtils.time.formatDuration(trackDurationNum, true).map(v => `\`${v}\``).join(", ") : "\`Unknown-Duration\`";
            
            const trackString = tracks?.length > 1 
                ? `> **\`${tracks.length}\` Tracks:** ${trackDurationString}` // translate
                : tracks.length ? `> **\`${tracks.length}\` Track:** ${trackDurationString}` : `> \`N/A\`` // translate
                
            const embed = new Embed().setAuthor({
                    name: plCreator?.name ? `Creator: ${plCreator.name}${plCreator.country ? ` - ${plCreator.country}` : ""}` : plAuthorData?.name ? `${plAuthorData?.name} - © Deezcord` : `© ${configData.name}`,
                    iconURL: plCreator?.image ? plCreator.image : plAuthorData?.image ? `${plAuthorData?.image}` : configData.iconURL,
                    url: (plCreator?.link || plCreator?.id) ? plCreator.link || `https://www.deezer.com/profile/${plCreator.id}` : plAuthorData?.link ? `${plAuthorData?.link}` : configData.inviteURL
                })
                .setThumbnail(plImg ? `${plImg}` : undefined)
                .setTitle(`📑 Playlist loaded`)
                .addField(`Name:`, `> ${plName}`)
                .addField(`Description:`, `>>> ${plDescription.split(/(\r\n|\r|\n)/g).filter(v => !/(\r\n|\r|\n)/g.test(v)).map(x => `*${x}*`).join("\n")}`)
                .addField(`Loaded tracks:`, trackString)
                .setFooter(plRelease ? {text:`Released: ${plRelease}`} : undefined)
            
            // if est for queuing
            const EST = addSongToTop ? (player.queue.current?.duration || player.position) - player.position : (this.client.DeezUtils.array.sumNumbersOnly([...player.queue].slice(0, player.queue.size - tracks.length), x => x.duration) || player.position) - player.position;
            if(enqueued && !skipSong) {
                embed.setTitle(`📑 Added playlist to the queue`)
                .addField(`Queue position:`, `> \`#${addSongToTop ? "1" : player.queue.size}\``, true)
                .addField(`Estimated time:`, `> <t:${this.client.DeezUtils.time.unixTimer(EST)}:R>`, true)
            } else if(enqueued && skipSong) {
                embed.setTitle(`⏭️ Playlist loaded and skipping to it`)
            }
            return {
                content: ``,
                ephemeral: true,
                embeds: [ embed ],
                components: [
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("Playlist-Link").setURL(plLink)
                    ])
                ]
            }
        } else if(["mixes/genre", "MIXES_LOADED", "RADIO_LOADED", "radio", "radios", "mixes", "mix"].includes(type)) {
            const mixName = data?.name || data?.title || "No-Title";
            const mixDescription = data?.description || "No-Description";
            const mixLink = data?.link || "https://www.deezer.com";
            const mixAuthorData = data.authorData || await this.client.DeezUtils.track.fetchAuthorData(data?.artist || tracks?.filter?.(v => v?.authorData)?.[0]?.authorData);
            
            const trackDurationNum = this.client.DeezUtils.array.sumNumbersOnly(tracks, x => x.duration);
            const trackDurationString = trackDurationNum ? this.client.DeezUtils.time.formatDuration(trackDurationNum, true).map(v => `\`${v}\``).join(", ") : "\`Unknown-Duration\`";
            
            const trackString = tracks?.length > 1 
                ? `> **\`${tracks.length}\` Tracks:** ${trackDurationString}` // translate
                : tracks.length ? `> **\`${tracks.length}\` Track:** ${trackDurationString}` : `> \`N/A\`` // translate

            const embed = new Embed().setAuthor({
                    name: mixAuthorData?.name ? `${mixAuthorData?.name} - © Deezcord` : `© ${configData.name}`,
                    iconURL: mixAuthorData?.image ? `${mixAuthorData?.image}` : configData.iconURL,
                    url: mixAuthorData?.link ? `${mixAuthorData?.link}` : configData.inviteURL
                })
                .setTitle(`📑 Genres-Mix Loaded`)
                .addField(`Name:`, `> ${mixName}`)
                .addField(`Description:`, `>>> ${mixDescription.split(/ +/g).map(x => `*${x}*`)}`)
                .addField(`Loaded Tracks:`, trackString);

            // if est for queuing
            const EST = addSongToTop ? (player.queue.current?.duration || player.position) - player.position : (this.client.DeezUtils.array.sumNumbersOnly([...player.queue].slice(0, player.queue.size - tracks.length), x => x.duration) || player.position) - player.position;
            if(enqueued && !skipSong) {
                embed.setTitle(`📑 Added genres-mix to the queue`)
                .addField(`Queue position:`, `> \`#${addSongToTop ? "1" : player.queue.size}\``, true)
                .addField(`Estimated time:`, `> <t:${this.client.DeezUtils.time.unixTimer(EST)}:R>`, true)
            } else if(enqueued && skipSong) {
                embed.setTitle(`⏭️ Genres-Mix loaded and skipping to it`)
            }
            return {
                content: ``,
                ephemeral: true,
                embeds: [ embed ],
                components: [
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("Mix-Link").setURL(mixLink)
                    ])
                ]
            } 
        } else if(["ALBUM_LOADED", "album", "albums"].includes(type)) {
            const albumData = this.createAlbumData(data);
            const [ albName, albLabel, albFans, albImg, albLink, albRelease, albArtist ] = [ albumData.name, albumData.label, albumData.fans, albumData.image, (albumData?.link || "https://www.deezer.com"), albumData.releasedAt, albumData.artist ]
            
            const fanString = !isNaN(albFans) && albFans > 1
                ? `> \`${this.client.DeezUtils.number.dotter(albFans)} Fans\`` // translate
                : !isNaN(albFans) ? `> \`${this.client.DeezUtils.number.dotter(albFans)} Fans\`` : `> \`N/A\``; // translate
            
            const trackDurationNum = this.client.DeezUtils.array.sumNumbersOnly(tracks, x => x.duration);
            const trackDurationString = trackDurationNum ? this.client.DeezUtils.time.formatDuration(trackDurationNum, true).map(v => `\`${v}\``).join(", ") : "\`Unknown-Duration\`";
            
            const trackString = tracks?.length > 1 
                ? `> **\`${tracks.length}\` Tracks:** ${trackDurationString}` // translate
                : tracks.length ? `> **\`${tracks.length}\` Track:** ${trackDurationString}` : `> \`N/A\`` // translate

            const embed = new Embed().setAuthor({
                    name: albArtist?.name ? `${albArtist?.name} - © Deezcord` : `© ${configData.name}`,
                    iconURL: albArtist?.image ? `${albArtist?.image}` : configData.iconURL,
                    url: albArtist?.link ? `${albArtist?.link}` : configData.inviteURL
                })
                .setThumbnail(albImg ? `${albImg}` : undefined)
                .setTitle(`📑 Album loaded`)
                .addField(`Name:`, `> ${albName}`, true)
                .addField(`Label:`, `> ${albLabel}`, true)
                .addField(`Fans:`, fanString)
                .addField(`Loaded tracks:`, trackString)
                .setFooter(albRelease ? {text:`Released: ${albRelease}`} : undefined);

            // if est for queuing
            const EST = addSongToTop ? (player.queue.current?.duration || player.position) - player.position : (this.client.DeezUtils.array.sumNumbersOnly([...player.queue].slice(0, player.queue.size - tracks.length), x => x.duration) || player.position) - player.position;
            if(enqueued && !skipSong) {
                embed.setTitle(`📑 Added album to the queue`)
                .addField(`Queue position:`, `> \`#${addSongToTop ? "1" : player.queue.size}\``, true)
                .addField(`Estimated time:`, `> <t:${this.client.DeezUtils.time.unixTimer(EST)}:R>`, true)
            } else if(enqueued && skipSong) {
                embed.setTitle(`⏭️ Album loaded and skipping to it`)
            }
            return {
                content: ``,
                ephemeral: true,
                embeds: [ embed ],
                components: [
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("Album-Link").setURL(albLink)
                    ])
                ]
            }
        } else if(["ARTIST_LOADED", "artist", "artists"].includes(type)) {
            const artistData = this.parseAuthorData({ artist: data });
            const [ artName, artAlbums, artFans, artImg, artLink ] = [ artistData.name, artistData.albums, artistData.fans, artistData.image, (artistData?.link || "https://www.deezer.com") ]
            
            const albumString = !isNaN(artAlbums) && artAlbums > 1
                ? `> \`${this.client.DeezUtils.number.dotter(artAlbums)} Albums\`` // translate
                : !isNaN(artAlbums) ? `> \`${this.client.DeezUtils.number.dotter(artAlbums)} Album\`` : `> \`N/A\``; // translate
           
            const fanString = !isNaN(artFans) && artFans > 1
                ? `> \`${this.client.DeezUtils.number.dotter(artFans)} Fans\`` // translate
                : !isNaN(artFans) ? `> \`${this.client.DeezUtils.number.dotter(artFans)} Fans\`` : `> \`N/A\``; // translate
            
            const trackDurationNum = this.client.DeezUtils.array.sumNumbersOnly(tracks, x => x.duration);
            const trackDurationString = trackDurationNum ? this.client.DeezUtils.time.formatDuration(trackDurationNum, true).map(v => `\`${v}\``).join(", ") : "\`Unknown-Duration\`";
            
            const trackString = tracks?.length > 1 
                ? `> **\`${tracks.length}\` Tracks:** ${trackDurationString}` // translate
                : tracks.length ? `> **\`${tracks.length}\` Track:** ${trackDurationString}` : `> \`N/A\`` // translate

            const embed = new Embed().setAuthor({
                    name: artName ? `${artName} - © Deezcord` : `© ${configData.name}`,
                    iconURL: artImg ? `${artImg}` : configData.iconURL,
                    url: artLink ? `${artLink}` : configData.inviteURL
                })
                .setThumbnail(artImg ? `${artImg}` : undefined)
                .setTitle(`🎧 Added artist's tracks loaded`)
                .addField(`Name:`, `> \`${artName}\``)
                .addField(`Albums:`, albumString, true)
                .addField(`Fans:`, fanString, true)
                .addField(`Loaded tracks:`, trackString);

            // if est for queuing
            const EST = addSongToTop ? (player.queue.current?.duration || player.position) - player.position : (this.client.DeezUtils.array.sumNumbersOnly([...player.queue].slice(0, player.queue.size - tracks.length), x => x.duration) || player.position) - player.position;
            if(enqueued && !skipSong) {
                embed.setTitle(`🎧 Added artist's tracks to the queue`)
                .addField(`Queue position:`, `> \`#${addSongToTop ? "1" : player.queue.size}\``, true)
                .addField(`Estimated time:`, `> <t:${this.client.DeezUtils.time.unixTimer(EST)}:R>`, true)
            } else if(enqueued && skipSong) {
                embed.setTitle(`⏭️ Artist's tracks loaded and skipping to it`)
            }
            
            return {
                content: ``,
                ephemeral: true,
                embeds: [ embed ],
                components: [
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("Artist-Link").setURL(artLink)
                    ])
                ]
            }
        } else if(["CHARTS_LOADED", "chart", "charts"].includes(type)) {
            if(data?.isPlaylist) {
                if(!data.tracks) data.tracks = tracks;
                const plData = this.createPlaylistData(data);
                const plImg = plData.image;
                const plName = plData?.name || plData?.title || "No-Title";
                const plLink = plData?.link || "https://www.deezer.com"; 
                const plCreator = plData.creator?.id ? this.client.DeezApi.parseUserData(await this.client.DeezApi.user.data(plData.creator?.id).catch(() => plData.creator)) : null;
                const plAuthorData = data.authorData || await this.client.DeezUtils.track.fetchAuthorData(data?.artist || tracks?.filter?.(v => v?.authorData)?.[0]?.authorData);
                
                const trackDurationNum = this.client.DeezUtils.array.sumNumbersOnly(tracks, x => x.duration);
                const trackDurationString = trackDurationNum ? this.client.DeezUtils.time.formatDuration(trackDurationNum, true).map(v => `\`${v}\``).join(", ") : "\`Unknown-Duration\`";
                
                const trackString = tracks?.length > 1 
                    ? `> **\`${tracks.length}\` Tracks:** ${trackDurationString}` // translate
                    : tracks.length ? `> **\`${tracks.length}\` Track:** ${trackDurationString}` : `> \`N/A\`` // translate
                    
                const embed = new Embed().setAuthor({
                        name: plCreator?.name ? `Creator: ${plCreator.name}` : plAuthorData?.name ? `${plAuthorData?.name} - © Deezcord` : `© ${configData.name}`,
                        iconURL: plCreator?.image ? plCreator.image : plAuthorData?.image ? `${plAuthorData?.image}` : configData.iconURL,
                        url: (plCreator?.link || plCreator?.id) ? plCreator.link || `https://www.deezer.com/profile/${plCreator.id}` : plAuthorData?.link ? `${plAuthorData?.link}` : configData.inviteURL
                    })
                    .setThumbnail(plImg ? `${plImg}` : undefined)
                    .setTitle(`<:deezer:1018174807092760586> Today's chart playlist loaded`)
                    .addField(`Name:`, `> **${plName}**`)
                    .addField(`Loaded tracks:`, trackString)
                    .addField(`Avg. Track-Ranking:`, `> \`#${Math.floor(10*(tracks.map(x => x.rank).reduce((a,b) => a+b,0) / tracks.length || 0))/10}\``)
                    
                // if est for queuing
                const EST = addSongToTop ? (player.queue.current?.duration || player.position) - player.position : (this.client.DeezUtils.array.sumNumbersOnly([...player.queue].slice(0, player.queue.size - tracks.length), x => x.duration) || player.position) - player.position;
                if(enqueued && !skipSong) {
                    embed.setTitle(`<:deezer:1018174807092760586> Added today's chart playlist to the queue`)
                    .addField(`Queue position:`, `> \`#${addSongToTop ? "1" : player.queue.size}\``, true)
                    .addField(`Estimated time:`, `> <t:${this.client.DeezUtils.time.unixTimer(EST)}:R>`, true)
                } else if(enqueued && skipSong) {
                    embed.setTitle(`⏭️ Today's chart playlist loaded and skipping to it`)
                }
                return {
                    content: ``,
                    ephemeral: true,
                    embeds: [ embed ],
                    components: [
                        new ActionRowBuilder().addComponents([
                            new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("Playlist-Link").setURL(plLink)
                        ])
                    ]
                }
            }
            const trackDurationNum = this.client.DeezUtils.array.sumNumbersOnly(tracks, x => x.duration);
            const trackDurationString = trackDurationNum ? this.client.DeezUtils.time.formatDuration(trackDurationNum, true).map(v => `\`${v}\``).join(", ") : "\`Unknown-Duration\`";
            
            const trackString = tracks?.length > 1 
                ? `> **\`${tracks.length}\` Tracks:** ${trackDurationString}` // translate
                : tracks.length ? `> **\`${tracks.length}\` Track:** ${trackDurationString}` : `> \`N/A\`` // translate
                
            const embed = new Embed().setAuthor({
                    name: `Deezer.com Charts - © Deezcord`,
                    iconURL: "https://cdn.discordapp.com/emojis/1018174807092760586.webp?size=128&quality=lossless",
                    url: "https://www.deezer.com/channels/charts"
                })
                .setThumbnail(configData.iconURL)
                .setTitle(`<:deezer:1018174807092760586> Today's charts loaded`)
                .addField(`Loaded tracks:`, trackString)
                .addField(`Avg. Track-Ranking:`, `> \`#${Math.floor(10*(tracks.map(x => x.rank).reduce((a,b) => a+b,0) / tracks.length || 0))/10}\``)
            
            // if est for queuing
            const EST = addSongToTop ? (player.queue.current?.duration || player.position) - player.position : (this.client.DeezUtils.array.sumNumbersOnly([...player.queue].slice(0, player.queue.size - tracks.length), x => x.duration) || player.position) - player.position;
            if(enqueued && !skipSong) {
                embed.setTitle(`📑 Added today's charts to the queue`)
                .addField(`Queue position:`, `> \`#${addSongToTop ? "1" : player.queue.size}\``, true)
                .addField(`Estimated time:`, `> <t:${this.client.DeezUtils.time.unixTimer(EST)}:R>`, true)
            } else if(enqueued && skipSong) {
                embed.setTitle(`⏭️ Today's charts loaded and skipping to it`)
            }
            return {
                content: ``,
                ephemeral: true,
                embeds: [ embed ],
                components: [
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("Charts-List").setURL("https://www.deezer.com/channels/charts")
                    ])
                ]
            }
        } else {
            const theData = data?.data?.data?.[0] || data?.data?.[0] || data?.data;
            const track = this.createUnresolvedData(theData, theData?.playlist, theData?.album);
            const [ tName, tImg, tAlbum, tAuthor, tDuration, tLink, tRank ] = [track.title, track.thumbnail, track.albumData, track.authorData ?? track.author, track.duration, track.uri, track.rank ]
            const trackDurationString = tDuration ? this.client.DeezUtils.time.formatDuration(tDuration, true).map(v => `\`${v}\``).join(", ") : "\`Unknown-Duration\`";
            const embed = new Embed()
                .setAuthor({
                    name: tAuthor?.name ? `${tAuthor?.name} - © Deezcord` : `© ${configData.name}`,
                    iconURL: tAuthor?.image ? `${tAuthor?.image}` : configData.iconURL,
                    url: tAuthor?.link ? `${tAuthor?.link}` : configData.inviteURL
                })
                .setThumbnail(tImg ? `${tImg}` : undefined)
                .setTitle(`🎵 Track loaded`)
                .addField(`Title:`, `> \`${tName}\``)
                .addField(`Duration:`, `> ${trackDurationString}`, true)
                .setFooter(tRank ? { text: `#${this.client.DeezUtils.number.dotter(tRank)} Track on Deezer` } : undefined);
            // if track of an album
            if(tAlbum?.name) embed.addField(`Track's album:`, `> [\`${tAlbum.name}\`](${tAlbum.link})`)
            
            // if est for queuing
            const EST = addSongToTop ? (player.queue.current?.duration || player.position) - player.position : (this.client.DeezUtils.array.sumNumbersOnly([...player.queue], x => x.duration) || player.position) - player.position;
            if(enqueued && !skipSong) {
                embed.setTitle(`🎵 Added track to the queue`)
                .addField(`Queue position:`, `> \`#${addSongToTop ? "1" : player.queue.size}\``, true)
                .addField(`Estimated time:`, `> <t:${this.client.DeezUtils.time.unixTimer(EST)}:R>`, true)
            } else if(enqueued && skipSong) {
                embed.setTitle(`⏭️ Track loaded and skipping to it`)
            }

            return { 
                content: ``,
                ephemeral: true,
                embeds: [ embed ],
                components: [
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("Track-Link").setURL(tLink),
                        tAlbum?.link ? new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(parseEmoji("<:deezer:1018174807092760586>")).setLabel("Album-Link").setURL(tAlbum?.link) : undefined
                    ].filter(Boolean))
                ]
            }
        }
    }
}