# Deezercord | A Music Bot for Deezer

Official Repository for the Community Deezer Music Power Bot. 

*Not affialiated with deezer.com, but using deezer.com Features only!*

<a href="https://deezer.com" target="_blank"><img src="https://user-images.githubusercontent.com/68145571/197169083-60567cc3-245b-4a76-88d4-b2df1df9ddb8.jpeg"></a>

# Features [Planned]

✔ Listen to Music from Deezer

✔ Latest Chart Playlists auto-player Command

✔ Fast and crisp Audio Quality

✔ Feature Rich and stable

✔ Statistics

✔ Link your Account and do activities with it


# Public Bot

- Check it out



# Self-Hosting Guide

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
