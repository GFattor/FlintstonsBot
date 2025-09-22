import { CommandInteractionOptionResolver, Interaction } from "discord.js";
import { client } from "../..";
import { Event } from "../../structs/types/Event";

export default new Event({
    name: "interactionCreate",
    run(interaction: Interaction) {
        // Só segue se for um slash command (ChatInputCommandInteraction)
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        // Agora o TS sabe que interaction.options existe
        const options = interaction.options as CommandInteractionOptionResolver;

        command.run({
            client: client,
            interaction: interaction,
            option: options
        });
    }
});
