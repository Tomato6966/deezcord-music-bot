import { validColors, validColorsStrings } from "../data/ValidColors.mjs";
import { getDateTimeString } from "./TimeUtils.mjs";
/**
 * @param {validColors} Colordisplay Valid Color for the Console
 * @param {string} text Text to log and display
 * @param {boolean} dateEnabled If there should be a timestamp Log in Cyan
 */
export const color_log = (Colordisplay = ["FgGreen"], text = "No Text added", dateEnabled = true, prefix) => { 
    const color = Colordisplay.map(color => Object.keys(validColorsStrings).includes(color) ? validColors[color] : validColors.FgWhite).join(``); 

    if(!dateEnabled) {
        if(prefix) return console.log(
            validColors.FgCyan, prefix, validColors.Reset,
            validColors.FgRed, `[::]`, validColors.Reset, 
            color, text, validColors.Reset
        );
        return console.log(color, text, validColors.Reset);
    }

    if(prefix) return console.log(
        validColors.FgCyan, getDateTimeString(), validColors.Reset,
        validColors.FgRed, `[::]`, validColors.Reset, 
        validColors.FgCyan, prefix, validColors.Reset,
        validColors.FgRed, `[::]`, validColors.Reset, 
        color, text, validColors.Reset
    );
    return console.log(
        validColors.FgCyan, getDateTimeString(), validColors.Reset,
        validColors.FgRed, `[::]`, validColors.Reset, 
        color, text, validColors.Reset
    );
}


export class Logger {
    /**
     * Create a Logger with logLevels, default logLevel == 1, which means, no debugs.
     * @param {{prefix: string|false, dateEnabled: boolean, logLevel: 0|1|2|3|4|5}} options - The options value.
     */
    constructor(options = {}) {
        this.prefix = options.colorDefault ?? "INFO-LOG";
        this.dateEnabled = options.dateEnabled ?? true;
        this.logLevel = options.logLevel ?? (process.env.LOGLEVEL || 1);
    }
    debug(...text) {
        if(this.logLevel > 0) return;
        return color_log(["Dim"], String(text.join(" ")), this.dateEnabled, this.prefix && typeof this.prefix === "string" ? this.prefix : undefined)
    }
    info(...text) {
        if(this.logLevel > 1) return;
        return color_log(["FgGreen"],  String(text.join(" ")), this.dateEnabled, this.prefix && typeof this.prefix === "string" ? this.prefix : undefined)
    }
    log(...text) {
        if(this.logLevel > 2) return;
        return color_log(["FgWhite"],  String(text.join(" ")), this.dateEnabled, this.prefix && typeof this.prefix === "string" ? this.prefix : undefined)
    }
    success(...text) {
        if(this.logLevel > 3) return;
        return color_log(["FgGreen", "Bright"],  String(text.join(" ")), this.dateEnabled, this.prefix && typeof this.prefix === "string" ? this.prefix : undefined)
    }
    warn(...text) {
        if(this.logLevel > 4) return;
        return color_log(["FgYellow"],  String(text.join(" ")), this.dateEnabled, this.prefix && typeof this.prefix === "string" ? this.prefix : undefined)
    }
    error(...text) {
        if(this.logLevel > 5) return;
        return color_log(["FgRed"],  String(text.join(" ")), this.dateEnabled, this.prefix && typeof this.prefix === "string" ? this.prefix : undefined)
    }
}