import Fastify from "fastify";
import fetch from 'node-fetch';
import { Logger } from "../utils/Logger.mjs";

export class APIClient {
    constructor(options = {}) {
        this.port = options.port ?? 3000
        this.secret = options.secret
        this.redirect = options.redirect
        this.appId = options.appId
        /** @type {import("./BotClient.mjs").BotClient} */
        this.client = options.client
        this.BaseURL = "https://api.deezer.com"
        this.logger = new Logger({ prefix: "DEEZAPI" });
        this.searchLimit = 100;
        // https://developers.deezer.com/api/explorer
    }
    user = {
        saveDeezerUserId: async (discordUserId) => {
            const data = this.accessTokenOfDB(discordUserId);
            if(!data?.deezerToken) return console.error("No deezer Token saved yet");
            const meData = await this.user.me(data.deezerToken);
            if(!meData?.id) return console.error("No data found about myself"); 
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
            if(!access_token) throw new Error("No access token provided");
            if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
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
        // user's history
        lastAlbums: async (ID) => {
            return await this.makeRequest(`user/${ID}/albums`)
        },
        lastArtists: async (ID) => {
            return await this.makeRequest(`user/${ID}/artists`)
        },
        lastCharts: async (ID) => {
            return await this.makeRequest(`user/${ID}/charts`)
        },
        lastPlaylists: async (ID) => {
            return await this.makeRequest(`user/${ID}/playlists`)
        },
        history: async (ID, access_token) => { // oauth
            if(!access_token) throw new Error("No access token provided");
            if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/history?access_token=${access_token}`)
        },
        notifications: async (ID, access_token) => { // oauth
            if(!access_token) throw new Error("No access token provided");
            if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/notifications?access_token=${access_token}`)
        },
        permissions: async (ID, access_token) => { // oauth
            if(!access_token) throw new Error("No access token provided");
            if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/permissions?access_token=${access_token}`)
        },
        options: async (ID, access_token) => { // oauth
            if(!access_token) throw new Error("No access token provided");
            if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/options?access_token=${access_token}`)
        },
        personalSongs: async (ID, access_token) => { // oauth
            if(!access_token) throw new Error("No access token provided");
            if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`user/${ID}/personal_songs?access_token=${access_token}`)
        },
        recommendations: {
            all: async (ID, access_token, limit) => { // oauth
                if(!access_token) throw new Error("No access token provided");
                if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
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
                if(!access_token) throw new Error("No access token provided");
                if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/albums?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            releases: async (ID, access_token, limit) => { // oauth
                if(!access_token) throw new Error("No access token provided");
                if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/releases?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            artists: async (ID, access_token, limit) => { // oauth
                if(!access_token) throw new Error("No access token provided");
                if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/artists?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            playlists: async (ID, access_token, limit) => { // oauth
                if(!access_token) throw new Error("No access token provided");
                if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/playlists?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            tracks: async (ID, access_token, limit) => { // oauth
                if(!access_token) throw new Error("No access token provided");
                if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/tracks?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
            radios: async (ID, access_token, limit) => { // oauth
                if(!access_token) throw new Error("No access token provided");
                if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
                return await this.makeRequest(`user/${ID}/recommendations/radios?access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
            },
        },
        searchHistories: async (query, access_token, limit) => {
            if(!access_token) throw new Error("No access token provided");
            if(typeof access_token !== "string" || !access_token.length) throw new SyntaxError("No Valid access token provided");
            return await this.makeRequest(`search/history?q=${query.replaceAll(" ", "+")}&access_token=${access_token}&limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`)
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
            album: async (ID) => {
                return await this.makeRequest(`album/${ID}`);
            },
            artist: async (ID) => {
                return await this.makeRequest(`artist/${ID}`);
            },
            track: async (ID) => {
                return await this.makeRequest(`track/${ID}`);
            },
            playlist: async (ID) => {
                return await this.makeRequest(`playlist/${ID}`);
            },
            podcast: async (ID) => {
                return await this.makeRequest(`podcast/${ID}`);
            },
            radio: async (ID) => {
                return await this.makeRequest(`radio/${ID}`);
            },
            radioTracks: async (ID, limit) => {
                const radioData = await this.makeRequest(`radio/${ID}`);
                if(radioData.tracklist) {
                    const tracks = await this.makeRequest(`radio/${ID}/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`, true).catch(() => []);
                    return { radioInfo: radioData, tracks: tracks.map(createTrackResolveable) }
                }
                return bull
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
            getAll: async (limit) => {
                return await this.makeRequest(`chart/0?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            getTracks: async (limit) => {
                return await this.makeRequest(`chart/0/tracks?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            getAlbums: async (limit) => {
                return await this.makeRequest(`chart/0/albums?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            getArtists: async (limit) => {
                return await this.makeRequest(`chart/0/artists?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            getPlaylists: async (limit) => {
                return await this.makeRequest(`chart/0/playlists?limit=${limit && typeof limit == "number" && limit < 101 && limit > 0 ? limit : this.searchLimit}`);
            },
            getPodcasts: async (limit) => {
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
                logger: true,
                trustProxy: true,
            });
    
            fastify.get('/login', (request, reply) => {
                return reply.redirect(`https://connect.deezer.com/oauth/auth.php?app_id=${this.appId}&redirect_uri=${this.redirect}/callback&perms=basic_access,email,offline_access,manage_library, delete_library, listening_history`);
            })
    
            fastify.get('/callback', async (request, reply) => {
                if (!request?.query?.code) return {
                    Error: 'Didn\'t got the code for the authentication.',
                };
    
                let deezerResponse = await fetch(`https://connect.deezer.com/oauth/access_token.php?app_id=${this.appId}&secret=${this.secret}&code=${request?.query?.code}`).catch(err => {
                    return {
                        Error: err,
                    };
                });
    
                if(!deezerResponse) return {
                    Error: 'Didn\'t got the access token from deezer.',
                };
    
                deezerResponse = await deezerResponse?.text();
    
                if(!deezerResponse) return {
                    Error: 'Can\'t parse your access token from deezer.',
                };
    
                deezerResponse = await fetch(`https://api.deezer.com/user/me?${deezerResponse}`).catch(err => {
                    return {
                        Error: err,
                    };
                });
    
                if(!deezerResponse) return {
                    Error: 'User data from deezer.',
                };
    
                deezerResponse = await deezerResponse?.json();
    
                if(!deezerResponse) return {
                    Error: 'Can\'t parse your user data from deezer.',
                };
    
                /**
                 *  Event to work with the authentication.
                 *  @returns {deezerResponse} JSON object with the deezer api response
                 */
                this.client.emit('apiAuthentication', (deezerResponse));
    
                this.logger.debug(`New Authentication from ${deezerResponse?.name ?? 'Unkown User'}`);
    
                return {
                    message: `Authentication done.`,
                };
            });
    
            fastify.listen({ port: this.port, host: process.env.APIHOST || "localhost" }, (err, address) => {
                if (err) return PromiseReject(err);
                
                this.logger.debug(`API online at ${address}`);
                
                return PromiseResolve(`API online at ${address}`);
            })
        })
        
    }
}
