import { Command } from "../../structs/types/Command";
import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, Collection } from "discord.js";



export default new Command({
    name: "darius",
    description: "reply with noxus",
    type: ApplicationCommandType.ChatInput,
    async run({interaction}){

        

        interaction.reply({ephemeral: true, content: "noxus", components: []})
    },
    
})