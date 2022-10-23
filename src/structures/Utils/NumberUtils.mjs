export class DeezCordNumberUtils {
    /** @param {import("../BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
    }
    formatter(num, digits = 2) {
        const lookup = [
          { value: 1, symbol: "" },
          { value: 1e3, symbol: "k" },
          { value: 1e6, symbol: "M" },
          { value: 1e9, symbol: "G" },
          { value: 1e12, symbol: "T" },
          { value: 1e15, symbol: "P" },
          { value: 1e18, symbol: "E" }
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        const item = lookup.slice().reverse().find(i => num >= i.value);
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }
    dotter(num) {
        return String(num).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
    }
}