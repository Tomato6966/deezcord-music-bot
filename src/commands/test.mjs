/** @type {import("../data/DeezCordTypes.mjs").CommandExport} */ 
export default {
    name: "test",
    description: "Tests",
    async execute(client, interaction) {
        await interaction.deferReply();
        await interaction.editReply({
            content: `test`
        });
    }
}