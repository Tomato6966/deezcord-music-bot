import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

// for each folder inside of /commands, you need to define a dirSetup.
// that's how to define permissions for all commands inside of that folder.
export const dirSetup = [
    /*{
        Folder: "Info", // == FolderName
        name: "info", // == CommandName 
        localizations: [
            {name: ["de", "info"], description: ["de", "Bekomme Information über Server/Nutzer/Bot"]}
        ],

        // defaultPermissions: new PermissionsBitField([PermissionFlagsBits.Administrator]).bitfield,
        // dmPermissions: new PermissionsBitField([PermissionFlagsBits.Administrator]).bitfield,
        
        description: "Get Information about Server/User/Bot/...",
        groups: [
            {
                Folder: "User",
                name: "user",
                description: "Userspecific Informations",
                localizations: [
                    {name: ["de", "user"], description: ["de", "Nutzer spezifische Informationen"]}
                ],
            },
            {
                Folder: "Bot",
                name: "bot",
                description: "Bot specific Informations",
                localizations: [
                    {name: ["de", "bot"], description: ["de", "Bot spezifische Informationen"]}
                ],
            }
        ]
    }*/
]