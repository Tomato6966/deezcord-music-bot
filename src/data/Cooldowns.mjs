// categories or commands, which shall have the "high" Cooldown
export const cooldownCategoriesHigh = ["player"];
export const cooldownCommandsHigh = ["login"];
export const defaultCooldownMsHigh = 5000;

// categories or commands, which shall have a general cooldown
export const cooldownCategories = [""];
export const cooldownCommands = [""];
export const defaultCooldownMs = 400;

// global Commands Cooldowns Data
export const maximumCoolDownCommands = {
    time: 10000,
    amount: 6, // over 10 seconds a user can do 6 commands, 
}