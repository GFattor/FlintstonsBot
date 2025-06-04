import { Command } from "../../structs/types/Command";
import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, Collection } from "discord.js";

const row2 = new ActionRowBuilder<ButtonBuilder>({components: [
    new ButtonBuilder({customId: "ta", label: "nao clique", style: ButtonStyle.Success})
]})

export default new Command({
    name: "ping",
    description: "reply with pong",
    type: ApplicationCommandType.ChatInput,
    async run({interaction}){

        const row = new ActionRowBuilder<ButtonBuilder>({components: [
            new ButtonBuilder({customId: "test-button", label: "Clique aqui", style: ButtonStyle.Success})
        ]})

        interaction.reply({ephemeral: true, content: "pong", components: [row]})
    },
    buttons: new Collection([
        ["test-button", async (interaction) => {
            interaction.update({components: [row2]})
        }]
    ])
})