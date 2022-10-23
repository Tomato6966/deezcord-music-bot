import { validColors } from "../../data/ValidColors.mjs";
import { DeezCordTimeUtils } from "./TimeUtils.mjs";
const TimeUtils = new DeezCordTimeUtils(undefined);

/**
 * @param {validColors} Colordisplay Valid Color for the Console
 * @param {string} text Text to log and display
 * @param {boolean} dateEnabled If there should be a timestamp Log in Cyan
 */
export const color_log = (Colordisplay = ["FgGreen"], text = "No Text added", dateEnabled = true, prefix) => { 
    const color = Colordisplay.map(color => validColors[color] || validColors.FgWhite).join(` `); 

    if(!dateEnabled) {
        if(prefix) return console.log(
            validColors.FgCyan, prefix, 
            validColors.FgRed, `[::]`, 
            color, ...text, validColors.Reset
        );
        return console.log(color, ...text, validColors.Reset);
    }
    if(prefix) return console.log(
        validColors.FgCyan, TimeUtils.getDateTimeString(), 
        validColors.FgRed, `[::]`, 
        validColors.FgCyan, prefix, 
        validColors.FgRed, `[::]`, 
        color, ...text, validColors.Reset
    );
    return console.log(
        validColors.FgCyan, TimeUtils.getDateTimeString(),
        validColors.FgRed, `[::]`,
        color, ...text, validColors.Reset
    );
}


export class Logger {
    /**
     * Create a Logger with logLevels, default logLevel == 1, which means, no debugs.
     * @param {{prefix: string|false, dateEnabled: boolean, logLevel: 0|1|2|3|4|5}} options - The options value.
     */
    constructor(options = {}) {
        this.prefix = options.prefix ?? "INFO-LOG";
        this.dateEnabled = options.dateEnabled ?? true;
        this.logLevel = options.logLevel ?? (process.env.LOGLEVEL || 1);
    }
    debug(...text) {
        if(typeof this?.logLevel !== "undefined" && this.logLevel > 0) return;
        return color_log(["FgWhite", "Dim"], text, this.dateEnabled, this.prefix && typeof this.prefix === "string" ? `Debug  - ${this.prefix}` : "Debug")
    }
    info(...text) {
        if(typeof this?.logLevel !== "undefined" && this.logLevel > 1) return;
        return color_log(["FgCyan", "Bright"], text, this.dateEnabled, this.prefix && typeof this.prefix === "string" ? `Info   - ${this.prefix}` : "Info")
    }
    log(...text) {
        if(typeof this?.logLevel !== "undefined" && this.logLevel > 2) return;
        return color_log(["FgWhite"], text, this.dateEnabled, this.prefix && typeof this.prefix === "string" ? `Log    - ${this.prefix}` : "Log")
    }
    success(...text) {
        if(typeof this?.logLevel !== "undefined" && this.logLevel > 3) return;
        return color_log(["FgGreen", "Bright"], text, this.dateEnabled, this.prefix && typeof this.prefix === "string" ? `Success- ${this.prefix}` : "Success")
    }
    warn(...text) {
        if(typeof this?.logLevel !== "undefined" && this.logLevel > 4) return;
        return color_log(["FgYellow"], text, this.dateEnabled, this.prefix && typeof this.prefix === "string" ? `Warn   - ${this.prefix}` : "Warn")
    }
    error(...text) {
        if(typeof this?.logLevel !== "undefined" && this.logLevel > 5) return;
        return color_log(["FgRed"], text, this?.dateEnabled ?? true, this?.prefix && typeof this.prefix === "string" ? `Error  - ${this.prefix}` : "Error")
    }
    pure(...text) {
        return console.log(...text)
    }
}