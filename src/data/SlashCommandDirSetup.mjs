import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

export const dirSetup = [
    {
        Folder: "Info", // == FolderName
        name: "info", // == CommandName 
        localizations: [
            {name: ["de", "info"], description: ["de", "Bekomme Information über Server/Nutzer/Bot"]}
        ],
        // defaultPermissions: new PermissionsBitField([PermissionFlagsBits.Administrator]).bitfield,
        // dmPermissions: new PermissionsBitField([PermissionFlagsBits.Administrator]).bitfield,
        
        description: "Get Information about Server/User/Bot/...",
        /*groups: [
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
        ]*/
    }
]