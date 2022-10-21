import Fastify from "fastify";
import fetch from 'node-fetch';

export class APIClient {
    constructor(options = {}) {
        this.port = options.port ?? 3000
        this.secret = options.secret
        this.redirect = options.redirect
        this.appId = options.appId
        this.client = options.client
        this.logger = this.client.logger
        this.init();
    }

    async init() {
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

        fastify.listen({ port: this.port }, (err, address) => {
            if (err) throw err;
            this.logger.debug(`API online at ${address}`);
        })
    }
}
