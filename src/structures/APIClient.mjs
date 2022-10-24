import Fastify from "fastify";
import fetch from 'node-fetch';
import { Logger } from "./Utils/Logger.mjs";

export class APIClient {
    constructor(options = {}) {
        this.port = options.port ?? 3000
        this.secret = options.secret
        this.domain = options.domain
        if (this.domain?.endsWith("/")) this.domain = this.domain.substring(0, this.domain.length - 1)
        this.appId = options.appId
        /** @type {import("./BotClient.mjs").BotClient} */
        this.client = options.client
        this.BaseURL = "https://api.deezer.com"
        this.logger = new Logger({prefix: "DEEZAPI"});
        this.searchLimit = 100;
        // https://developers.deezer.com/api/explorer
    }
    async fetchAll(path, maxLimit = 1000, maxLen=100) {
        const data = [];
        let tracks = await this.makeRequest(`${path}?limit=100&index=0`);
        if(tracks.data?.length) data.push(...tracks.data);
        if(tracks.data.length < maxLen || (tracks.total && tracks.total <= maxLen)) return data;
        while(tracks.data?.length && tracks.data?.length === maxLen && maxLimit > data.length) {
            tracks = await this.makeRequest(`${path}?limit=100&index=${data.length}`);
            if(tracks.data?.length) data.push(...tracks.data);
            else break;
        }
        if(data.length > maxLimit) data.splice(maxLimit, data.length);
        return data;
    }
    user = {
        resetDeezerAccount: async (discordUserId) => {
            return await this.client.db.userData.update({
                where: {
                    userId: discordUserId
                },
                data: {
                    deezerToken: "",
                    deezerId: "",
                    deezerName: "",
                    deezerPictureMedium: "",
                    deezerTrackList: "",
                }
            })
        },
        saveDeezerAccount: async (deezerData, discordUserId) => {
            return await this.client.db.userData.upsert({
                where: {
                    userId: discordUserId
                },
                update: {
                    deezerToken: deezerData.accessToken,
                    deezerId: deezerData.id,
                    deezerName: deezerData.name,
                    deezerPictureMedium: deezerData.picture_medium,
                    deezerTrackList: deezerData.tracklist,
                },
                create: {
                    userId: discordUserId,
                    deezerToken: deezerData.accessToken,
                    deezerId: deezerData.id,
                    deezerName: deezerData.name,
                    deezerPictureMedium: deezerData.picture_medium,
                    deezerTrackList: deezerData.tracklist,
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
        me: async (access_token) => {
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/me?access_token=${access_token}`)
        },
        data: async (ID) => {
            return await this.makeRequest(`user/${ID}`)
        },
        flow: async (ID) => {
            return await this.makeRequest(`user/${ID}/flow`)
        },
        followings: async (ID) => {
            return await this.makeRequest(`user/${ID}/followings`)
        },
        followers: async (ID) => {
            return await this.makeRequest(`user/${ID}/followers`)
        },
        notifications: async (ID, access_token) => { // oauth
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/notifications?access_token=${access_token}`)
        },
        permissions: async (ID, access_token) => { // oauth
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/permissions?access_token=${access_token}`)
        },
        options: async (ID, access_token) => { // oauth
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/options?access_token=${access_token}`)
        },
        personalSongs: async (ID, access_token) => { // oauth
            if (!access_token) throw new Error("No access token provided");
            if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/personal_songs?access_token=${access_token}`)
        },
        history: {
            albums: async (ID) => {
                return await this.makeRequest(`user/${ID}/albums`)
            },
            artists: async (ID) => {
                return await this.makeRequest(`user/${ID}/artists`)
            },
            charts: async (ID) => {
                return await this.makeRequest(`user/${ID}/charts`)
            },
            playlsits: async (ID) => {
                return await this.makeRequest(`user/${ID}/playlists`)
            },
            general: async (ID, access_token) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/history?access_token=${access_token}`)
            },
            search: async (query, access_token, limit) => {
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`search/history?q=${query.replaceAll(" ", "+")}&access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
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
                    radios: await this.user.recommendations.radios(ID, access_token, limit)
                }
            },
            albums: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/albums?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            releases: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/releases?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            artists: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/artists?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            playlists: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/playlists?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            tracks: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/tracks?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            radios: async (ID, access_token, limit) => { // oauth
                if (!access_token) throw new Error("No access token provided");
                if (typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/radios?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
        }
    }
    deezer = {
        search: {
            // searching deezer
            all: async (query, limit) => {
                return await this.makeRequest(`search?q=${query.replaceAll(" ", "+")}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            albums: async (query, limit) => {
                return await this.makeRequest(`search/album?q=${query.replaceAll(" ", "+")}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            artists: async (query, limit) => {
                return await this.makeRequest(`search/artist?q=${query.replaceAll(" ", "+")}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            playlists: async (query, limit) => {
                return await this.makeRequest(`search/playlist?q=${query.replaceAll(" ", "+")}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            podcasts: async (query, limit) => {
                return await this.makeRequest(`search/podcast?q=${query.replaceAll(" ", "+")}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            radios: async (query, limit) => {
                return await this.makeRequest(`search/radio?q=${query.replaceAll(" ", "+")}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            tracks: async (query, limit) => {
                return await this.makeRequest(`search/track?q=${query.replaceAll(" ", "+")}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            users: async (query, limit) => {
                return await this.makeRequest(`search/user?q=${query.replaceAll(" ", "+")}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
        },
        fetch: {
            // get deezer datas
            album: async (ID, all = true) => {
                const res = await this.makeRequest(`album/${ID}`);
                if(all && (!(res?.tracks||res?.tracks?.data||[])?.length || (res?.tracks||res?.tracks?.data||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.albumTracks(ID, 100, true);
                    if(allTracks?.length) res.tracks = allTracks; 
                }
                return res;
            },
            albumTracks: async (ID, limit, all = true) => {
                if(all) return await this.fetchAll(`album/${ID}/tracks`);
                return await this.makeRequest(`album/${ID}/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },

            artist: async (ID, all = true) => {
                const res = await this.makeRequest(`artist/${ID}`);
                if(all && (!(res?.tracks||res?.tracks?.data||[])?.length || (res?.tracks||res?.tracks?.data||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.artistTracks(ID, 100, true);
                    if(allTracks?.length) res.tracks = allTracks; 
                }
                return res;
            },
            artistTracks: async (ID, limit, all = true) => {
                if(all) return await this.fetchAll(`artist/${ID}/top`);
                return await this.makeRequest(`artist/${ID}/top?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },

            track: async (ID) => {
                return await this.makeRequest(`track/${ID}`);
            },

            playlist: async (ID, all = true) => {
                const res = await this.makeRequest(`playlist/${ID}`);
                if(all && (!(res?.tracks||res?.tracks?.data||[])?.length || (res?.tracks||res?.tracks?.data||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.playlistTracks(ID, 100, true);
                    if(allTracks?.length) res.tracks = allTracks; 
                }
                return res;
            },
            playlistTracks: async (ID, limit, all = true) => {
                if(all) return await this.fetchAll(`playlist/${ID}/tracks`);
                return await this.makeRequest(`playlist/${ID}/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            podcast: async (ID) => {
                return await this.makeRequest(`podcast/${ID}`);
            },
            radio: async (ID, all = true) => {
                const res = await this.makeRequest(`radio/${ID}`);
                if(all && (!(res?.tracks||res?.tracks?.data||[])?.length || (res?.tracks||res?.tracks?.data||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.radioTracks(ID, 100, true);
                    if(allTracks?.length) res.tracks = allTracks; 
                }
                return res;
            },
            radioTracks: async (ID, limit, all = true) => {
                if(all) return await this.fetchAll(`radio/${ID}/tracks`);
                const tracks = await this.makeRequest(`radio/${ID}/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`, true).catch(() => []);
                return tracks
            },
            episode: async (ID) => {
                return await this.makeRequest(`episode/${ID}`);
            },
        },
        genres: {
            fetchAll: async () => {
                return await this.makeRequest(`genre`);
            }
        },
        charts: { // charts
            all: async (limit) => {
                if(limit > 100) return await this.fetchAll("chart/0", limit, 99);
                return await this.makeRequest(`chart/0?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            tracks: async (limit) => {
                if(limit > 100) return await this.fetchAll("chart/0/tracks", limit, 99);
                return await this.makeRequest(`chart/0/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            albums: async (limit) => {
                if(limit > 100) return await this.fetchAll("chart/0/albums", limit, 99);
                return await this.makeRequest(`chart/0/albums?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            artists: async (limit) => {
                if(limit > 100) return await this.fetchAll("chart/0/artists", limit, 99);
                return await this.makeRequest(`chart/0/artists?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            playlists: async (limit) => {
                if(limit > 100) return await this.fetchAll("chart/0/playlists", limit, 99);
                return await this.makeRequest(`chart/0/playlists?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            podcasts: async (limit) => {
                if(limit > 100) return await this.fetchAll("chart/0/podcasts", limit, 99);
                return await this.makeRequest(`chart/0/podcasts?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            }
        }
    }

    async makeRequest(path) {
        const rawData = await fetch(`${this.BaseURL}/${path}`);
        return rawData ? await rawData.json() : null;
    }

    async init() {
        return new Promise((PromiseResolve, PromiseReject) => {
            const fastify = Fastify({
                logger: true, //@TODO add here own logger (ask tomato what exactly he mean)
                trustProxy: true,
            });
            
            // 1. login with discord
                // browser session
            // -> deezer/login
                // session discord nutzername

            fastify.get('/login/:randomString', (request, reply) => {
                const randomString = request?.params?.randomString;
                if (!randomString) {
                    reply.type('application/json').code(429);
                    return {
                        Error: 'Please run the "/account login" command to get access to this link.',
                    };
                }

                const userCache = this.client.DeezCache.loginCache.get(randomString);
                if (!userCache) {
                    reply.type('application/json').code(429);
                    return {
                        Error: 'Please run the "/account login" command to get access to this link.',
                    };
                }

                if (userCache?.validUntil <= Date.now()) {
                    this.client.DeezCache.loginCache.delete(randomString);

                    reply.type('application/json').code(429);
                    return {
                        Error: 'This link is not valid anymore. Run "/account login" again to get a new link.',
                    };
                }

                // Redirect the user to the OAuth from deezer
                return reply.redirect(`https://connect.deezer.com/oauth/auth.php?app_id=${this.appId}&redirect_uri=${this.domain}/callback/${randomString}&perms=basic_access,offline_access,manage_library, delete_library, listening_history`);
            })

            fastify.get('/callback/:randomString', async (request, reply) => {
                const randomString = request?.params?.randomString;
                if (!randomString) {
                    throw new Error('Please run the "/account login" command to get access to this link.');
                }

                try {
                    if (!request?.query?.code) {
                        throw new Error('Didn\'t got the code for the authentication.');
                    }

                    const userCache = this.client.DeezCache.loginCache.get(randomString);
                    if (!userCache) {
                        throw new Error('This authentication is too old. Please run the "/account login" command again.');
                    }

                    let deezerResponse = await fetch(`https://connect.deezer.com/oauth/access_token.php?app_id=${this.appId}&secret=${this.secret}&code=${request?.query?.code}`).catch(err => {
                        throw new Error(`${err}`);
                    });

                    if (!deezerResponse) {
                        throw new Error('Didn\'t got the access token from deezer.');
                    }

                    const accessToken = await deezerResponse?.text();

                    if (!accessToken) {
                        throw new Error('Can\'t parse your access token from deezer.');
                    }

                    deezerResponse = await fetch(`https://api.deezer.com/user/me?${deezerResponse}`).catch(err => {
                        throw new Error(`${err}`);
                    });

                    if (!deezerResponse) {
                        throw new Error('User data from deezer.');
                    }

                    deezerResponse.accessToken = accessToken;

                    deezerResponse = await deezerResponse?.json();

                    if (!deezerResponse) {
                        throw new Error('Can\'t parse your user data from deezer.');
                    }

                    const discordUser = await this.client.users.fetch(userCache?.userId).catch(err => {
                    }) || {};

                    /**
                     *  Event to work with the authentication.
                     *  @returns {deezerResponse} JSON object with the deezer api response
                     *  @returns {import("discord.js").User} The discord user behind this auth
                     */
                    this.client.emit('apiAuthentication', (deezerResponse, discordUser));

                    this.logger.debug(`New Authentication from ${deezerResponse?.name ?? 'Unkown User'}`);

                    this.client.DeezCache.loginCache.delete(randomString); // Delete the user from the cache

                    reply.type('application/json').code(200)
                    return {
                        message: `Authentication done. Your account is now linked with the bot.`,
                    };

                } catch (err) {
                    this.client.DeezCache.loginCache.delete(randomString); // Delete the user from the cache
                    reply.type('application/json').code(500)
                    return {
                        Error: err,
                        Info: 'If this happens often please report that to "Tomato#6966" or "fb_sean#1337\n"!'
                    };
                }
            });

            fastify.listen({port: this.port, host: process.env.APIHOST || "localhost"}, (err, address) => {
                if (err) return PromiseReject(err);

                this.logger.success(`API online at ${address}`);

                return PromiseResolve(`API online at ${address}`);
            })
        })

    }
}
