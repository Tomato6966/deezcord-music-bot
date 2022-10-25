import { DeezCordArrayUtils } from "./Utils/ArrayUtils.mjs";
import { DeezCordBotUtils } from "./Utils/BotUtils.mjs";
import { DeezCordNumberUtils } from "./Utils/NumberUtils.mjs";
import { DeezCordPermissionUtils } from "./Utils/PermissionUtils.mjs";
import { DeezCordTimeUtils } from "./Utils/TimeUtils.mjs";
import { DeezCordTrackUtils } from "./Utils/TrackUtils.mjs";

export class DeezCordUtils {
    /** @param {import("./BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
        /** @type {DeezCordTrackUtils} */
        this.track = new DeezCordTrackUtils(client);
        /** @type {DeezCordTimeUtils} */
        this.time = new DeezCordTimeUtils(client);
        /** @type {DeezCordPermissionUtils} */
        this.perms = new DeezCordPermissionUtils(client);
        /** @type {DeezCordBotUtils} */
        this.bot = new DeezCordBotUtils(client);
        /** @type {DeezCordNumberUtils} */
        this.number = new DeezCordNumberUtils(client);
        /** @type {DeezCordArrayUtils} */
        this.array = new DeezCordArrayUtils(client);
    }
}