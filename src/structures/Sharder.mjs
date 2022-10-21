import { ClusterManager } from 'discord-hybrid-sharding';

/** @returns {"auto"|number} totalShards for ClusterManager, must be bigger than 0, default: "auto" */
const getTotalShards = () => {
    if(!process.env.TOTAL_SHARDS) return "auto";
    if(process.env.TOTAL_SHARDS.toLowerCase() === "auto") return "auto";
    if(!isNaN(process.env.TOTAL_SHARDS) && Number(process.env.TOTAL_SHARDS) > 0) return Number(process.env.TOTAL_SHARDS)
    return "auto";
}

/** @returns {number} shardsPerCluster for ClusterManager, must be bigger than 0, default: 4 */
const getShardsPerCluster = () => !isNaN(process.env.SHARDS_PER_CLUSTER) && Number(process.env.SHARDS_PER_CLUSTER) > 0 ? Number(process.env.SHARDS_PER_CLUSTER) : 4;

/** @returns {"process"|"worker"} mode for ClusterManager, default: "process" */
const getShardingMode = () => process.env.SHARDING_MODE && validModes.includes(process.env.SHARDING_MODE.toLowerCase()) ? process.env.SHARDING_MODE : 'process'

export const CreateManager = () => {
    const validModes = [ "process", "worker" ]

    const manager = new ClusterManager(`${process.cwd()}/src/bot.mjs`, {
        totalShards: getTotalShards(),
        shardsPerClusters: getShardsPerCluster(),
        mode: getShardingMode(),
        token: process.env.DISCORD_TOKEN,
    });
    
    manager.on('clusterCreate', cluster => {
        // cluster.on("message", async (message) => {});
        
    });
    manager.spawn({ timeout: -1 });
};
