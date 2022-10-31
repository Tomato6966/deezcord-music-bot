/** 
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").VoiceState} oldState
 * @param {import("discord.js").VoiceState} newState
*/
export default async (client, oldState, newState) => {
    // if not valid voice channel join/leave/switch return;
    if (stateChange(["streaming", "serverDeaf", "serverMute", "selfDeaf", "selfVideo", "selfMute", "suppress"], oldState, newState)) return;

    if (!oldState.channel && newState.channel) {
        if(newState.id === client.user.id) return botVoiceChannelJoin(client, oldState, newState, newState.channel)
        return voiceChannelJoin(client, oldState, newState, newState.channel)
    }
    if (oldState.channel && !newState.channel) {
        if(newState.id === client.user.id) return botVoiceChannelLeave(client, oldState, newState, oldState.channel)
        return voiceChannelLeave(client, oldState, newState, oldState.channel)
    }
    if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        if(newState.id === client.user.id) return botVoiceChannelSwitch(client, oldState, newState, oldState.channel, newState.channel)
        return voiceChannelSwitch(client, oldState, newState, oldState.channel, newState.channel)
    }
}

/** 
 * Users who switch a channel (join & leave)
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").VoiceState} oldState
 * @param {import("discord.js").VoiceState} newState
 * @param {import("discord.js").VoiceBasedChannel} leftChannel
 * @param {import("discord.js").VoiceBasedChannel} joinedChannel
*/
export async function voiceChannelSwitch(client, oldState, newState, leftChannel, joinedChannel) {

}

/** 
 * Users who join a channel
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").VoiceState} oldState
 * @param {import("discord.js").VoiceState} newState
 * @param {import("discord.js").VoiceBasedChannel} joinedChannel
*/
export async function voiceChannelJoin(client, oldState, newState, joinedChannel) {

}

/** 
 * Users who leave a channel
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").VoiceState} oldState
 * @param {import("discord.js").VoiceState} newState
 * @param {import("discord.js").VoiceBasedChannel} leftChannel
*/
export async function voiceChannelLeave(client, oldState, newState, leftChannel) {

}






/** 
 * client switched a channel
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").VoiceState} oldState
 * @param {import("discord.js").VoiceState} newState
 * @param {import("discord.js").VoiceBasedChannel} leftChannel
 * @param {import("discord.js").VoiceBasedChannel} joinedChannel
*/
export async function botVoiceChannelSwitch(client, oldState, newState, leftChannel, joinedChannel) {
    const player = client.DeezCord.players.get(newState.id);
    if(!player) return;
    player.voiceChannel = joinedChannel.id;
    return;
    const destroyed = await botVoiceChannelLeave(client, oldState, newState, leftChannel);
    if(!destroyed) await botVoiceChannelJoin(client, oldState, newState, joinedChannel);
}

/** 
 * client joined a channel
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").VoiceState} oldState
 * @param {import("discord.js").VoiceState} newState
 * @param {import("discord.js").VoiceBasedChannel} joinedChannel
*/
export async function botVoiceChannelJoin(client, oldState, newState, joinedChannel) {
    const player = client.DeezCord.players.get(newState.id);
    if(!player) return;
    if(!player.voiceChannel) return player.destroy();
    // if wrong vc return
    if(joinedChannel.id !== player.voiceChannel) return

    return;
}

/** 
 * client left a channel
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").VoiceState} oldState
 * @param {import("discord.js").VoiceState} newState
 * @param {import("discord.js").VoiceBasedChannel} leftChannel
*/
export async function botVoiceChannelLeave(client, oldState, newState, leftChannel) {
    const player = client.DeezCord.players.get(newState.id);
    if(!player) return false;
    if(!player.voiceChannel) return player.destroy(), true;

    const memberCount = leftChannel.members.filter(m => !m.user.bot && !m.voice.deaf && !m.voice.mute).size;
    if(!memberCount) return player.destroy(), true; // empty vc
    return false;
}

/**
 * 
 * @param {string[]} vars 
 * @param {import("discord.js").VoiceState} oldState 
 * @param {import("discord.js").VoiceState} newState 
 * @returns 
 */
export function stateChange(vars, oldState, newState) {
    if(!oldState.sessionId || oldState.sessionId !== newState.sessionId) return false;
    for(const v of vars) {
        if((oldState[v] === false && newState[v] === true) || (oldState[v] === true && newState[v] === false)) {
            return true;
        }
    }
    return false;
}