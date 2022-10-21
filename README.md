# Base discord.js v14 Command Handler

- Official Repoistory: [Tomato6966/discord-js-v14-handler](https://github.com/Tomato6966/discord-js-v14-handler)

Written by Tomato6966
Made for [Deezcord](https://github.com/Tomato6966/deezcord-music-bot)


# Features

✔ Slash Commands

✔ Sub-Slash Commands

✔ Group-Sub-Slash Commands

✔ Context-Menus

✔ Extends discord.js for better types

✔ Default sharding via [discord-hybrid-sharding](https://npmjs.com/discord-hybrid-sharding)

✔ jsdoc Types

✔ color based log-level logger without a console coloring module

✔ slash command mentions cache builder

✔ fast, and memory friendly File Loading (no synchronus, memory rss blocking)

✔ Modern ESM Style

And more!

## Slash Commands Limits:

In the `/src/commands` you can create up to **100 Commands / Folders**.

 - Slash Commands

Inside of a Folder of `/src/commands`, e.g: `/src/commands/Info` you can create up to **25 Commands / Folders**

 - Sub-Slash Commands

Inside of a Folder of a Folder of `/src/commands`, e.g: `/src/commands/Info/User` you can create up to **25 Commands**

 - Group-Sub-Slash Commands

### Important!

**NOTE:** For Every folder you create inside of `/src/commands`, you need to write the DirSetup object in: `/src/data/SlashCommandDirSetup.mjs`

 - This Project is a `module` aka written in `esm`, so your JS Files should be named: `*.jsm`

