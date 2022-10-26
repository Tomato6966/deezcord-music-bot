import Fastify from "fastify";
import fetch, { Headers } from 'node-fetch';
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
        this.logger = new Logger({prefix: "DEEZAPI "});
        this.searchLimit = 100;
        // https://developers.deezer.com/api/explorer
    }
    async fetchAll(path, maxLimit = 1000, maxLen=99, access_token) {
        const data = [];
        let tracks = await this.makeRequest(`${path}?limit=100&index=0&${this.parseAccessToken(access_token)}`);
        if(tracks.data?.length) data.push(...tracks.data);
        if(tracks.data.length < maxLen || (tracks.total && tracks.total <= maxLen)) return data;
        while(tracks.data?.length && tracks.data?.length === maxLen && maxLimit > data.length) {
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
            return await this.makeRequest(`user/me?${this.parseAccessToken(access_token)}`)
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
                if(all && (!(res?.tracks||res?.tracks?.data||[])?.length || (res?.tracks||res?.tracks?.data||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.albumTracks(ID, 100, true);
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
                if(all && (!(res?.tracks||res?.tracks?.data||[])?.length || (res?.tracks||res?.tracks?.data||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.artistTracks(ID, 100, true);
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
                if(all && (!(res?.tracks||res?.tracks?.data||[])?.length || (res?.tracks||res?.tracks?.data||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.playlistTracks(ID, 100, true);
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
                if(all && (!(res?.tracks||res?.tracks?.data||[])?.length || (res?.tracks||res?.tracks?.data||[]).length < 100)) {
                    const allTracks = await this.deezer.fetch.radioTracks(ID, 100, true);
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
                return await this.deezer.fetch.radio(ID, all, access_token);
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
                if(limit > 100) return await this.fetchAll("chart/0", limit, 99, access_token);
                return await this.makeRequest(`chart/0?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            tracks: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/tracks", limit, 99, access_token);
                return await this.makeRequest(`chart/0/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            albums: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/albums", limit, 99, access_token);
                return await this.makeRequest(`chart/0/albums?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            artists: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/artists", limit, 99, access_token);
                return await this.makeRequest(`chart/0/artists?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            playlists: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/playlists", limit, 99, access_token);
                return await this.makeRequest(`chart/0/playlists?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}&${this.parseAccessToken(access_token)}`);
            },
            podcasts: async (limit, access_token) => {
                if(limit > 100) return await this.fetchAll("chart/0/podcasts", limit, 99, access_token);
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
