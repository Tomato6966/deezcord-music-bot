
/**
 * Execute the Command
 * @typedef {(client: import("../structures/BotClient.mjs").BotClient, interaction: import("discord.js").CommandInteraction) => Promise<any> } executeType
 * @typedef {(client: import("../structures/BotClient.mjs").BotClient, interaction: import("discord.js").UserContextMenuCommandInteraction | import("discord.js").MessageContextMenuCommandInteraction) => Promise<any> } contextExecuteType
*/

import { ApplicationCommandType, BitField } from "discord.js";

/**
 * @typedef {Object} optionTypesType
 * @prop {string} attachment
 * @prop {string} string
 * @prop {string} number
 * @prop {string} role
 * @prop {string} user
 * @prop {string} channel
 * @prop {string} stringchoices
 * @prop {string} numberchoices
*/
 /**
 * @typedef optionsType
 * @prop {string} name
 * @prop {string} description
 * @prop {boolean} [required]
 * @prop {optionTypesType} type
 * @prop {boolean} [autocomplete]
 */
/**
 * @typedef {Object} CommandExportType
 * @prop {executeType} execute
 * @prop {string} name
 * @prop {string} [description]
 * @prop {BitField|string} defaultPermissions
 * @prop {boolean} [guildOnly]
 * @prop {{name: string[], description:string[]}[]} [localizations]
 * @prop {bigint[]} [allowedPermissions]
 * @prop {boolean} [allowSkipGroup]
 * @prop {optionsType[]} [options]
 * @prop { { user?: number, guild?:number } } [cooldown]
 * @prop {string} [category]
 * @prop {string} [commandId] - set by the loader
 * @prop {string} [slashCommandKey] - set by the loader
 * @prop {string} [mention] - set by the loader
 */
/**
 * @typedef {CommandExportType} CommandExport
 */
/**
 * @typedef {Object} ContextCommandExportType
 * @prop {contextExecuteType} execute
 * @prop {string} name
 * @prop {ApplicationCommandType} type
 * @prop {{name: string[]}[]} [localizations]
 * @prop {BitField|string} defaultPermissions
 * @prop {boolean} [isContext] - set by the loader
 */
/**
 * @typedef {ContextCommandExportType} ContextCommandExport
 */
exports.unused = {}
