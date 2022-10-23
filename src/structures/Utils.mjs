import { DeezCordBotUtils } from "./Utils/BotUtils.mjs";
import { DeezCordNumberUtils } from "./Utils/NumberUtils.mjs";
import { DeezCordPermissionUtils } from "./Utils/PermissionUtils.mjs";
import { DeezCordTimeUtils } from "./Utils/TimeUtils.mjs";
import { DeezCordTrackUtils } from "./Utils/TrackUtils.mjs";

export class DeezCordUtils {
    /** @param {import("./BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
        this.track = new DeezCordTrackUtils(client);
        this.time = new DeezCordTimeUtils(client);
        this.perms = new DeezCordPermissionUtils(client);
        this.bot = new DeezCordBotUtils(client);
        this.number = new DeezCordNumberUtils(client);
    }
}