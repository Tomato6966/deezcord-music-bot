
/**
 * Execute the Command
 * @typedef {(client: import("../structures/BotClient.mjs").BotClient, interaction: import("discord.js").CommandInteraction) => Promise<any> } executeType
*/

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
 * @prop {boolean} [guildOnly]
 * @prop {{name: string[], description:string[]}[]} [localizations]
 * @prop {string} [slashCommandKey]
 * @prop {string[]} [aliases]
 * @prop {bigint[]} [allowedPermissions]
 * @prop {boolean} [allowSkipGroup]
 * @prop {optionsType[]} options
 */
/**
 * @typedef {Object} preCommandsType
 * @prop {CommandExportType[]} [preCommands]
 */
/**
 * @typedef {CommandExportType & preCommandsType} CommandExport
 */
exports.unused = {}
