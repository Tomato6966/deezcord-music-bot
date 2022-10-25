<center>
 <a href="https://discord.gg/7KJnTDKQ8N" target="_blank"><img src="https://discord.com/api/guilds/1034415148263297045/widget.png?style=shield" /></a>
 <a href="https://deezer.com" target="_blank"><img src="https://img.shields.io/badge/Deezer-FEAA2D?style=for-the-badge&logo=deezer&logoColor=white"/></a>
 <a href="https://www.postgresql.org" target="_blank"><img src="[https://img.shields.io/badge/Deezer-FEAA2D?style=for-the-badge&logo=deezer&logoColor=white](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)"/></a>
 <a href="https://discord.gg/7KJnTDKQ8N" target="_blank"><img src="https://discord.com/api/guilds/1034415148263297045/widget.png?style=shield" /></a>
 <a href="https://www.fastify.io/" target="_blank"><img src="https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white" /></a>
 <a href="https://discord.gg/7KJnTDKQ8N" target="_blank"><img src="https://raster.shields.io/badge/maintenance-actively--developed-brightgreen.png" /></a>
</center>
# Deezercord | A Music Bot for Deezer

Official Repository for the Community Deezer Music Power Bot. 

*Not affialiated with deezer.com, but using deezer.com Features only!*

# Features [Planned]

✔ Listen to Music from Deezer

✔ Latest Chart Playlists auto-player Command

✔ Fast and crisp Audio Quality

✔ Feature Rich and stable

✔ Statistics

✔ Link your Account and do activities with it


# Public Bot

- Check it out: [Invite @Deezcord#2386](https://discord.com/oauth2/authorize?client_id=1032998523123290182&scope=bot&permissions=279218310144)

- Hosted 24/7 on: [bero-host](https://bero.milrato.dev) (#AD *Use code: `milrato` to save 20% permamently*)

- Coded by [@Tomato6966](https://github.com/Tomato6966) & [@fb-sean](https://github.com/fb-sean)

## Support & Updates Server

<a href="https://discord.gg/7KJnTDKQ8N" target="_blank"><img src="https://discord.com/api/guilds/1034415148263297045/widget.png?style=banner4" /></a>




# Self-Hosting Guide

- Note [here](https://github.com/Tomato6966/deezcord-music-bot/wiki) you can find a dedicated Wiki!

## Tutorial Video:

https://user-images.githubusercontent.com/68145571/197351293-bccfd84a-8e5b-41a9-9cde-f2a059f502ee.mp4

### Preparation:

**Software you need:**

 - [nodejs v16+](https://nodejs.org/en/download/) | [Linux Installer](https://github.com/Tomato6966/Debian-Cheat-Sheet-Setup/wiki/3.1-Install-nodejs-and-npm)
 - [Lavalink and thus java](https://github.com/Tomato6966/deezcord-music-bot/tree/LavalinkServer) with Deezer Setup (check the link for a tutorial)
 - [postgresQL best with citusdata.com](https://docs.citusdata.com/en/v11.1/installation/single_node_debian.html)
 
### Steps to get the Bot running

*assuming, you have a lavalink Server running, as well as a postgresQL database.*

0. [Download](https://github.com/Tomato6966/deezcord-music-bot/archive/refs/heads/main.zip) the repository or `git clone https://github.com/Tomato6966/deezcord-music-bot` it.

1. Rename `example.env` -> `.env`
    - Then fill in the Values
    - Make sure to pass the correct `LAVALINK_PORT`, `LAVALINK_HOST` and `LAVALINK_PASSWORD`
    - Also make sure to pass the correct `DATABASE_URL`

2. Install Packages
    - Do it by running: `npm install` in a console in the project repository
    
3. Initialize the Database
    - By doing: `npx prisma migrate dev` and afterwards `npx prisma generate`

4. Start it
    - Just type: `npm run start` or `node ./src/index.mjs`;


## Todos

✖ Listen to Music from Deezer

✖ Latest Chart Playlists auto-player Command

✖ Fast and crisp Audio Quality

✖ Feature Rich and stable

✖ Statistics

✖ Link your Account and do activities with it




