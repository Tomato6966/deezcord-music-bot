import Fastify from "fastify";
import session from "@fastify/session";
import cookie from '@fastify/cookie'
import { Authenticator } from "@fastify/passport";
import fetch, { Headers } from 'node-fetch';
import { Logger } from "./Utils/Logger.mjs";
import { Strategy } from "passport-discord";
import { Collection } from "discord.js";
import Regexes from "../data/Regexes.mjs";

/**
 * @typedef {object} DeezerResponseUserData
 * @prop {string} id: 4958449102,
 * @prop {string} accessToken: "awpdihjawdpihawdoiahdpiahwd",
 * @prop {string} name: 'Tomato6966',
 * @prop {string} lastname: '',
 * @prop {string} firstname: '',
 * @prop {string} email: 'XXXX.XXXX@gmail.com',
 * @prop {string} status: 0,
 * @prop {string} birthday: '0000-00-00',
 * @prop {string} inscription_date: '2022-05-02',
 * @prop {string} gender: '',
 * @prop {string} link: 'https://www.deezer.com/profile/4958449102',
 * @prop {string} picture: 'https://api.deezer.com/user/4958449102/image',
 * @prop {string} picture_small: 'https://e-cdns-images.dzcdn.net/images/user//56x56-000000-80-0-0.jpg',
 * @prop {string} picture_medium: 'https://e-cdns-images.dzcdn.net/images/user//250x250-000000-80-0-0.jpg',
 * @prop {string} picture_big: 'https://e-cdns-images.dzcdn.net/images/user//500x500-000000-80-0-0.jpg',
 * @prop {string} picture_xl: 'https://e-cdns-images.dzcdn.net/images/user//1000x1000-000000-80-0-0.jpg',
 * @prop {string} country: 'AT',
 * @prop {string} lang: 'DE',
 * @prop {string} is_kid: false,
 * @prop {string} explicit_content_level: 'explicit_display',
 * @prop {string} explicit_content_levels_available: [ 'explicit_display', 'explicit_no_recommendation', 'explicit_hide' ],
 * @prop {string} tracklist: 'https://api.deezer.com/user/4958449102/flow',
 * @prop {string} type: 'user'
 */

export class APIClient {
    constructor(options = {}) {
        /** @type {import("./BotClient.mjs").BotClient} */
        this.client = options.client
        
        this.regex = Regexes;

        // ensure .env variables
        this.ensureDotEnvVariables();

        this.port = process.env.DEEZER_API_PORT && !isNaN(process.env.DEEZER_API_PORT) ? Number(process.env.DEEZER_API_PORT) : 3000;
        this.domain = process.env.DEEZER_API_DOMAIN;
        this.host = process.env.DEEZER_API_HOSTNAME || "::";

        this.sessionUserCaches = new Collection();
        
        this.BaseURL = "https://api.deezer.com"
        this.logger = new Logger({ prefix: "DEEZAPI " });
        this.searchLimit = 100; // https://developers.deezer.com/api/explorer
        
        // Deezer Api Stuff
        this.DeezerAppId = process.env.DEEZER_APP_ID;
        this.DeezerSecretKey = process.env.DEEZER_APP_SECRET

        // set variables
        this.discordSecret = process.env.DISCORD_CLIENT_SECRET;
        this.discordId = process.env.DISCORD_CLIENT_ID;
        this.discordCallback = `${this.domain}${this.ensurPath(process.env.DISCORD_CLIENT_CALLBACK)}`;
        this.discordLoginLink = `${this.domain}${this.ensurPath(process.env.DISCORD_CLIENT_LOGIN)}`;
        this.deezerCallback = `${this.ensurPath(process.env.DEEZER_APP_CALLBACK)}`;
        this.deezerAppLogin = `${this.ensurPath(process.env.DEEZER_APP_LOGIN)}`;
    };
    ensureDotEnvVariables() {
        if(process.env.DEEZER_API_PORT?.length && (isNaN(process.env.DEEZER_API_PORT) || Number(process.env.DEEZER_API_PORT) > 65535 || Number(process.env.DEEZER_API_PORT) < 1)) throw new SyntaxError("provided 'env#DEEZER_API_PORT' Variable is not a valid Port-Number (must be between 1 and 65535");
        if(!process.env.DEEZER_API_DOMAIN?.length) throw new SyntaxError("Missing correct 'env#DEEZER_API_DOMAIN' input");
        else if(!this.regex.apiUrl.test(process.env.DEEZER_API_DOMAIN)) throw new SyntaxError("'env#DEEZER_API_DOMAIN' is not a valid URL input");
        
        if(process.env.DEEZER_API_HOSTNAME?.length && process.env.DEEZER_API_HOSTNAME !== "::" && process.env.DEEZER_API_HOSTNAME !== "localhost" && !this.regex.Ipv4Address.test(process.env.DEEZER_API_HOSTNAME)) throw new SyntaxError("Provided 'env#DEEZER_API_HOSTNAME' is not a valid IP ADDRESS nor '::' nor 'localhost'")

        if(!process.env.DISCORD_CLIENT_SECRET?.length || process.env.DISCORD_CLIENT_SECRET.length < 5) throw new SyntaxError("Missing correct 'env#DISCORD_CLIENT_SECRET'")
        if(!process.env.DISCORD_CLIENT_ID?.length || !this.regex.DiscordSnowfalke.test(process.env.DISCORD_CLIENT_ID)) throw new SyntaxError("Missing correct 'env#DISCORD_CLIENT_ID'")

        if(!process.env.DISCORD_CLIENT_CALLBACK?.length) throw new SyntaxError("Missing correct 'env#DISCORD_CLIENT_CALLBACK' input");
        if(!process.env.DEEZER_APP_CALLBACK?.length) throw new SyntaxError("Missing correct 'env#DISCORD_CLIENT_CALLBACK' input");
        
        // ensure domain style
        if (process.env.DEEZER_API_DOMAIN?.endsWith("/")) process.env.DEEZER_API_DOMAIN = process.env.DEEZER_API_DOMAIN.substring(0, process.env.DEEZER_API_DOMAIN.length - 1)
        
        // ensure login paths
        if(!process.env.DISCORD_CLIENT_LOGIN?.length) process.env.DISCORD_CLIENT_LOGIN = "/discordlogin";
        else if(!process.env.DISCORD_CLIENT_LOGIN.startsWith("/")) throw new SyntaxError("Missing correct 'env#process.env.DISCORD_CLIENT_LOGIN', it must be a path starting with /pathname...")
        
        if(!process.env.DEEZER_APP_LOGIN?.length) process.env.DEEZER_APP_LOGIN = "/deezerlogin";
        else if(!process.env.DEEZER_APP_LOGIN.startsWith("/")) throw new SyntaxError("Missing correct 'env#process.env.DEEZER_APP_LOGIN', it must be a path starting with /pathname...")
        
        return; 
    }
    ensurPath(path) {
        return path.startsWith("/") ? path : `/${path}`;
    }
    ensurePathEnd(path) {

    }
    async fetchAll(path, maxLimit = 1000, maxLen=100, access_token) {
        const data = [];
        let tracks = await this.makeRequest(`${path}?limit=100&index=0&${this.parseAccessToken(access_token)}`);
        if(tracks.data?.length) data.push(...tracks.data);
        if(!tracks?.data?.length || tracks?.data?.length < maxLen) return data;
        while(tracks.data?.length && tracks.data?.length >= maxLen && maxLimit > data.length) {
            tracks = await this.makeRequest(`${path}?limit=100&index=${data.length}&${this.parseAccessToken(access_token)}`);
            if(tracks.data?.length) data.push(...tracks.data);
            else break;
        }
        if(data.length > maxLimit) data.splice(maxLimit, data.length);
        return data;
    }
    parseAccessToken(access_token) {
        if(!access_token) return "filterout=param";
        if(!access_token.includes("access_token")) return `access_token=${access_token}`;
        const params = new URLSearchParams(access_token);
        return `access_token=${params.get("access_token")}`;
    }
    user = {
        resetDeezerAccount: async (discordUserId) => {
            return await this.client.db.userData.update({
                where: {
                    userId: discordUserId
                },
                data: {
                    deezerToken: null,
                    deezerName: null,
                    deezerImage: null,
                }
            })
        },
        
        saveDeezerAccount: async (deezerData, discordUserId) => {
            const deezerImage = this.client.DeezUtils.track.getUserImage(deezerData);
            return await this.client.db.userData.upsert({
                where: {
                    userId: discordUserId
                },
                update: {
                    deezerToken: deezerData.accessToken,
                    deezerId: deezerData.id,
                    deezerName: deezerData.name,
                    deezerImage: deezerImage,
                },
                create: {
                    userId: discordUserId,
                    deezerToken: deezerData.accessToken,
                    deezerId: deezerData.id,
                    deezerName: deezerData.name,
                    deezerImage: deezerImage,
                }
            })
        },
        saveDeezerUserId: async (discordUserId) => {
            const data = this.accessTokenOfDB(discordUserId);
            if (!data?.deezerToken) return console.error("No deezer Token saved yet");
            const meData = await this.user.me(data.deezerToken);
            if (!meData?.id) return console.error("No data found about myself");
            return await this.client.db.userData.update({
                where: {
                    userId: discordUserId
                },
                data: {
                    deezerId: meData.id
                }
            })
        },
        accessTokenOfDB: async (discordUserId) => {
            return await this.client.db.userData.findFirst({
                where: {
                    userId: discordUserId
                },
                select: {
                    deezerToken: true, deezerId: true,
                }
            });
        },

        /**
         * @param {string} access_token 
         * @param {boolean} [transformStrings] 
         * @returns {DeezerResponseUserData}
         */
        me: async (access_token, transformStrings) => {
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            /** @type {DeezerResponseUserData} */
            const res = await this.makeRequest(`user/me?${this.parseAccessToken(access_token)}`)
            
            res.accessToken = access_token;
            
            if(res && typeof res == "object" && transformStrings) for(const [k, v] of Object.entries(res)) res[k] = String(v)
            return res;
        },
        data: async (ID, access_token) => {
            return await this.makeRequest(`user/${ID}?${this.parseAccessToken(access_token)}`)
        },
        flow: async (ID, access_token) => {
            return await this.makeRequest(`user/${ID}/flow?${this.parseAccessToken(access_token)}`)
        },
        followings: async (ID, access_token) => {
            return await this.makeRequest(`user/${ID}/followings?${this.parseAccessToken(access_token)}`)
        },
        followers: async (ID, access_token) => {
            return await this.makeRequest(`user/${ID}/followers?${this.parseAccessToken(access_token)}`)
        },
        notifications: async (ID, access_token) => { // oauth
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/notifications?${this.parseAccessToken(access_token)}`)
        },
        permissions: async (ID, access_token) => { // oauth
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/permissions?${this.parseAccessToken(access_token)}`)
        },
        options: async (ID, access_token) => { // oauth
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/options?${this.parseAccessToken(access_token)}`)
        },
        personalSongs: async (ID, access_token) => { // oauth
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/personal_songs?${this.parseAccessToken(access_token)}`)
        },
        history: {
            albums: async (ID, access_token) => {
                return await this.makeRequest(`user/${ID}/albums?${this.parseAccessToken(access_token)}`)
            },
            artists: async (ID, access_token) => {
                return await this.makeRequest(`user/${ID}/artists?${this.parseAccessToken(access_token)}`)
            },
            charts: async (ID, access_token) => {
                return await this.makeRequest(`user/${ID}/charts?${this.parseAccessToken(access_token)}`)
            },
            playlsits: async (ID, access_token) => {
                return await this.makeRequest(`user/${ID}/playlists?${this.parseAccessToken(access_token)}`)
            },
            general: async (ID, access_token) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/history?${this.parseAccessToken(access_token)}`)
            },
            search: async (query, access_token, limit) => {
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`search/history?q=${query.replaceAll(" ", "+")}&${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            }
        },
        recommendations: {
            all: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return {
                    albums: await this.user.recommendations.albums(ID, access_token, limit),
                    releases: await this.user.recommendations.releases(ID, access_token, limit),
                    artists: await this.user.recommendations.artists(ID, access_token, limit),
                    playlists: await this.user.recommendations.playlists(ID, access_token, limit),
                    tracks: await this.user.recommendations.tracks(ID, access_token, limit),
                    radios: await this.user.recommendations.radios(ID, access_token, limit) // radio == mixes
                }
            },
            albums: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/albums?${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            releases: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/releases?${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            artists: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/artists?${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            playlists: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/playlists?${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            tracks: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/tracks?${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            radios: async (ID, access_token, limit) => { // oauth // radio == mixes
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/radios?${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            mixes: async(ID, access_token, limit) => {
                return await this.user.recommendations.radios(ID, access_token, limit);
            }
        }
    }
    deezer = {
        search: {
            // searching deezer
            all: async (query, limit, access_token) => {
                return await this.makeRequest(`search?q=${query.replaceAll(" ", "+")}&${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            albums: async (query, limit, access_token) => {
                return await this.makeRequest(`search/album?q=${query.replaceAll(" ", "+")}&${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            artists: async (query, limit, access_token) => {
                return await this.makeRequest(`search/artist?q=${query.replaceAll(" ", "+")}&${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            playlists: async (query, limit, access_token) => {
                return await this.makeRequest(`search/playlist?q=${query.replaceAll(" ", "+")}&${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            podcasts: async (query, limit, access_token) => {
                return await this.makeRequest(`search/podcast?q=${query.replaceAll(" ", "+")}&${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            radios: async (query, limit, access_token) => { // radio == mixes
                return await this.makeRequest(`search/radio?q=${query.replaceAll(" ", "+")}&${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            mixes: async (query, limit, access_token) => { // mixes == radio
                return this.deezer.search.radios(query, limit, access_token)
            },
            tracks: async (query, limit, access_token) => {
                return await this.makeRequest(`search/track?q=${query.replaceAll(" ", "+")}&${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            users: async (query, limit, access_token) => {
                return await this.makeRequest(`search/user?q=${query.replaceAll(" ", "+")}&${this.parseAccessToken(access_token)}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
        },
        fetch: {
            // get deezer datas
            album: async (ID, all = true, access_token) => {
                const res = await this.makeRequest(`album/${ID}?${this.parseAccessToken(access_token)}`);
                if(all && (!(res?.tracks?.data||res?.tracks||[])?.length || (res?.tracks?.data||res?.tracks||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.albumTracks(ID, 100, true, access_token);
                    if(allTracks?.length) res.tracks = allTracks; 
                }
                return res;
            },
            albumTracks: async (ID, limit, all = true, access_token) => {
                if(all) return await this.fetchAll(`album/${ID}/tracks`, undefined, undefined, access_token);
                return await this.makeRequest(`album/${ID}/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },

            artist: async (ID, all = true, access_token) => {
                const res = await this.makeRequest(`artist/${ID}?${this.parseAccessToken(access_token)}`);
                if(all && (!(res?.tracks?.data||res?.tracks||[])?.length || (res?.tracks?.data||res?.tracks||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.artistTracks(ID, 100, true, access_token);
                    if(allTracks?.length) res.tracks = allTracks; 
                }
                return res;
            },
            artistTracks: async (ID, limit, all = true, access_token) => {
                if(all) return await this.fetchAll(`artist/${ID}/top`, undefined, undefined, access_token);
                return await this.makeRequest(`artist/${ID}/top?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            track: async (ID, all, access_token) => {
                if(!access_token && typeof all == "string") access_token = all;
                return await this.makeRequest(`track/${ID}?${this.parseAccessToken(access_token)}`);
            },
            playlist: async (ID, all = true, access_token) => {
                const res = await this.makeRequest(`playlist/${ID}?${this.parseAccessToken(access_token)}`);
                if(all && (!(res?.tracks?.data||res?.tracks||[])?.length || (res?.tracks?.data||res?.tracks||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.playlistTracks(ID, 100, true, access_token);
                    if(allTracks?.length) res.tracks = allTracks; 
                }
                return res;
            },
            playlistTracks: async (ID, limit, all = true, access_token) => {
                if(all) return await this.fetchAll(`playlist/${ID}/tracks`, undefined, undefined, access_token);
                return await this.makeRequest(`playlist/${ID}/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            podcast: async (ID, all = true, access_token) => {
                if(!access_token && typeof all == "string") access_token = all;
                return await this.makeRequest(`podcast/${ID}?${this.parseAccessToken(access_token)}`);
            },
            radio: async (ID, all = true, access_token) => { // radio == mixes
                const res = await this.makeRequest(`radio/${ID}?${this.parseAccessToken(access_token)}`);
                if(all && (!(res?.tracks?.data||res?.tracks||[])?.length || (res?.tracks?.data||res?.tracks||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.radioTracks(ID, 100, true, access_token);
                    if(allTracks?.length) res.tracks = allTracks; 
                }
                return res;
            },
            radioTracks: async (ID, limit, all = true, access_token) => { // radio == mixes
                if(all) return await this.fetchAll(`radio/${ID}/tracks`, undefined, undefined, access_token);
                const tracks = await this.makeRequest(`radio/${ID}/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`, true).catch(() => []);
                return tracks
            },
            mix: async (ID, all = true, access_token) => { // mixes == radio
                return await this.deezer.fetch.radio(ID, 100, all, access_token);
            },
            mixTracks: async (ID, limit, all = true, access_token) => { // mixes == radio
                return await this.deezer.fetch.radioTracks(ID, limit, all, access_token);
            },
            episode: async (ID, all = true, access_token) => {
                if(!access_token && typeof all == "string") access_token = all;
                return await this.makeRequest(`episode/${ID}?${this.parseAccessToken(access_token)}`);
            },
        },
        genres: {
            fetchAll: async (access_token) => {
                return await this.makeRequest(`genre?${this.parseAccessToken(access_token)}`);
            }
        },
        charts: { // charts
            all: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0", limit, 100, access_token);
                return await this.makeRequest(`chart/0?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            tracks: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/tracks", limit, 100, access_token);
                return await this.makeRequest(`chart/0/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            albums: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/albums", limit, 100, access_token);
                return await this.makeRequest(`chart/0/albums?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            artists: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/artists", limit, 100, access_token);
                return await this.makeRequest(`chart/0/artists?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            playlists: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/playlists", limit, 100, access_token);
                return await this.makeRequest(`chart/0/playlists?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            podcasts: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/podcasts", limit, 100, access_token);
                return await this.makeRequest(`chart/0/podcasts?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            }
        }
    }

    async makeRequest(path, method="GET") {
        try {
            if(path.includes("?") && path.includes("filterout")) {
                const requestPath = path.split("?")[0];
                const requestParams = path.split("?")[1];
                const params = new URLSearchParams(requestParams)
                // remove smt
                if(params.get("filterout") === "param") params.delete("filterout");
                // default params
                if(!params.get("output")) params.append("output", "json");
                if(!params.get("limit")) params.append("limit", "100");
                if(!params.get("index")) params.append("index", "0");
                path = requestPath + (params ? `?${params}`.replaceAll("%2F", "/").replaceAll("%3F", "?").replaceAll("%3D", "=").replaceAll("%26", "&") : "");
            }
        } catch (x) {
            console.error(x)
        }
        this.logger.debug(`🌐 FETCHING: ${method}: "${this.BaseURL}/${path}"`)
        const rawData = await fetch(`${this.BaseURL}/${path}`, {
            method,
            headers: new Headers({
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Accept-Language": "en-us,en;q=0.5",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:101.0) Gecko/20100101 Firefox/101.0", // https://www.useragentstring.com/
            })
        });
        return rawData ? await rawData.json() : null;
    }

    parseUserData(data) {
        if(!data || typeof data !== "object") return;
        return {
            id: data.id,
            name: data.name,
            link: data.link || data.id ? `https://www.deezer.com/profile/${data.id}` : null,
            image: this.client.DeezUtils.track.getUserImage(data),
            country: data.country,
        }
    }

    async init() {
        const SessionSecret = this.client.DeezUtils.array.shuffle("q4t7w!z%C*F)J@NcRfUjXn2r5u8x/A?D(G+KaPdSgVkYp3s6v9y$B&E)H@McQeThWmZq4t7w!z%C*F-JaNdRgUjXn2r5u8x/A?D(G+KbPeShVmYp3s6v9y$B&E)H@McQfTjWnZr4t7w!z%C*F-JaNdRgUkXp2s5v8x/A?D(G+KbPeShVmYq3t6w9z$B&E)H@McQfTjWnZr4u7x!A%D*F-JaNdRgUkXp2s5v8y/B?E(H+KbPeShVmYq3t6w9z$C&F".split("")).join("");
        
        return new Promise(async (PromiseResolve, PromiseReject) => {
            // 1. login with discord
                // browser session
            // -> deezer/login
                // session discord nutzername

            // create fastify server
            const fastify = Fastify({
                logger: false, // @TODO add here own logger (ask tomato what exactly he mean)
                trustProxy: true,
            });

            // passport authenticator for requests
            const fastifyAuthenticator = new Authenticator()

            // register cookie and session
            fastify.register(cookie).register(session, {
                cookieName: "deezcord.discord.oauth2",
                secret: SessionSecret,
                cookie: { secure: false },
                saveUninitialized: false,
                // store: {}
                maxAge: this.client.DeezUtils.time.Millisecond.Day(7), // how long to keep in session
            });

            // register the fastifyAuthenticator
            fastify.register(fastifyAuthenticator.initialize()).register(fastifyAuthenticator.secureSession());

            // serialize session caches
            fastifyAuthenticator.registerUserSerializer((user) => {
                this.sessionUserCaches.set(user.id, user);
                return user.id;
            });
            // get from seralize the data from cache / db
            fastifyAuthenticator.registerUserDeserializer((id) => this.sessionUserCaches.get(id));
            // login in strategies
            fastifyAuthenticator.use(new Strategy({
                clientID: this.discordId,
                clientSecret: this.discordSecret,
                callbackURL: this.discordCallback,
                scope: ["identify", "guilds"],
            }, async (accessToken, refreshToken, profile, done) => {
                return done(null, profile);
            }))

            
            fastify.get(this.deezerAppLogin, (request, reply) => {
                if(!request.user?.id) {
                    reply.type('application/json').code(429);
                    return {
                        Error: `Please go to "${this.discordLoginLink}" and login with Discord first` 
                    }
                }
                // Redirect the user to the OAuth from deezer
                return reply.redirect(`https://connect.deezer.com/oauth/auth.php?app_id=${this.DeezerAppId}&redirect_uri=${this.domain}${this.deezerCallback}&perms=basic_access,offline_access,manage_library, delete_library, listening_history`);
            })
            // deezer callback
            fastify.get(this.deezerCallback, async (request, reply) => {
                if(!request.user?.id) {
                    reply.type('application/json').code(429);
                    return { Error: `Please go to "${this.discordLoginLink}" and login with Discord first`  }
                }
                try {
                    if (!request?.query?.code) throw new Error('Didn\'t got the code for the authentication.');
                    // parse access token String from deezer Authentications
                    const deezerAuthResponse = await fetch(`https://connect.deezer.com/oauth/access_token.php?app_id=${this.DeezerAppId}&secret=${this.DeezerSecretKey}&code=${request?.query?.code}`).then(x => x.text());
                    if (!deezerAuthResponse) throw new Error('Didn\'t got the access token from deezer.');
                    
                    // parse access_token out of url params
                    const accessToken = (new URLSearchParams(deezerAuthResponse)).get("access_token")
                    
                    // parse User responmse data
                    const deezerResponseData = await this.user.me(accessToken, true)
                    if (!deezerResponseData) throw new Error('Found no User-Data from Deezer.com');
                    
                    /** @type {(import("discord.js").User & { guilds: string[] }) | { id:string, username: string, guilds: string[] } } */
                    const discordUser = await this.client.users.fetch(request.user.id).catch(console.warn) || request.user || {};
                    if(discordUser && !discordUser.guilds) discordUser.guilds = request.user.guilds
                    
                    /**
                     *  Event to work with the authentication.
                     *  @returns {DeezerResponseUserData} JSON object with the deezer api response
                     *  @returns {import("discord.js").User & { guilds: string[] }} The discord user behind this auth
                     */
                    this.client.emit('apiAuthentication', { ...deezerResponseData, accessToken }, discordUser);

                    this.logger.debug(`New Authentication from ${deezerResponseData?.name ?? 'Unkown User'} | ${deezerResponseData.link ?? `https://www.deezer.com/profile/${deezerResponseData.id}`}`);
                    
                    // redirect back to the home-page
                    return reply.redirect("/");
                } catch (Error) {
                    this.logger.error(Error);
                    reply.type('application/json').code(500)
                    return { Info: 'If this happens often please report that to "Tomato#6966" or "fb_sean#1337\n"!', Error };
                }
            });
            
            fastify.get(process.env.DISCORD_CLIENT_LOGIN, { // /auth
                preValidation: fastifyAuthenticator.authenticate("discord")
            }, async (request, reply) => {});

            fastify.get(process.env.DISCORD_CLIENT_CALLBACK, { // /auth/redirect
                preValidation: fastifyAuthenticator.authenticate("discord", {
                    failureRedirect: "/",
                    successRedirect: process.env.DEEZER_APP_LOGIN,
                })
            }, async (request, reply) => {});

            // discord logout
            fastify.get("/logout", async (request, reply) => { // /auth/logout
                if(request.user) request.logout();
                reply.redirect("/");
            })

            fastify.listen({port: this.port, host: this.host}, (err, address) => {
                if (err) return PromiseReject(err);

                this.logger.success(`API online at ${address}`);

                return PromiseResolve(`API online at ${address}`);
            })
        })

    }
}
