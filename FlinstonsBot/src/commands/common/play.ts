import { Command } from "../../structs/types/Command";
import {
    ActionRowBuilder,
    ApplicationCommandType,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Collection,
    ChatInputCommandInteraction,
    GuildMember
} from "discord.js";
import { ExtendedClient } from "../../structs/ExtendedClient"; // necessário para type cast
import { YoutubeiExtractor } from "discord-player-youtubei"

export default new Command({
    name: "play",
    description: "Toca uma música via link ou nome",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "query",
            description: "Nome ou link da música",
            type: 3, // STRING
            required: true
        }
    ],
    async run({ client, interaction }) {
        const extendedClient = client as ExtendedClient;
        const query = (interaction as ChatInputCommandInteraction).options.getString("query", true);
        const channel = (interaction.member as GuildMember).voice?.channel;

        if (!channel) {
            return interaction.reply({
                content: "Você precisa estar em um canal de voz!",
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const result = await extendedClient.player.search(query, {
            requestedBy: interaction.user
        });

        if (!result || !result.tracks.length) {
            return interaction.editReply("Nenhuma música encontrada.");
        }

        let queue = extendedClient.player.nodes.get(interaction.guild!.id);

        if (!queue) {
            queue = await extendedClient.player.nodes.create(interaction.guild!, {
                metadata: interaction.channel
            });
        }

        try {
            if (!queue.connection) await queue.connect(channel);
        } catch (err) {
            extendedClient.player.nodes.delete(interaction.guildId!);
            return interaction.editReply("Não foi possível entrar no canal de voz.");
        }

        queue.addTrack(result.tracks[0]);

        if (!queue.isPlaying()) await queue.node.play();

        const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("music-pause")
                .setLabel("⏸️ Pause")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("music-resume")
                .setLabel("▶️ Resume")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("music-skip")
                .setLabel("⏭️ Skip")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("music-stop")
                .setLabel("⏹ Stop")
                .setStyle(ButtonStyle.Secondary)
        );

        return interaction.editReply({
            content: `🎶 Tocando: **${result.tracks[0].title}**`,
            components: [controlRow]
        });
    },
    buttons: new Collection<string, (interaction: ButtonInteraction) => any>([
        [
            "music-pause",
            async (interaction) => {
                const extendedClient = interaction.client as ExtendedClient;
                const queue = extendedClient.player.nodes.get(interaction.guildId!);
                if (!queue || !queue.isPlaying()) {
                    return interaction.reply({ content: "Nenhuma música está tocando.", ephemeral: true });
                }

                if (queue.node.isPaused()) {
                    return interaction.reply({ content: "A música já está pausada.", ephemeral: true });
                }

                queue.node.pause();
                interaction.reply({ content: "⏸️ Música pausada.", ephemeral: true });
            }
        ],
        [
            "music-resume",
            async (interaction) => {
                const extendedClient = interaction.client as ExtendedClient;
                const queue = extendedClient.player.nodes.get(interaction.guildId!);
                if (!queue || !queue.isPlaying()) {
                    return interaction.reply({ content: "Nenhuma música está tocando.", ephemeral: true });
                }

                if (!queue.node.isPaused()) {
                    return interaction.reply({ content: "A música já está tocando.", ephemeral: true });
                }

                queue.node.resume();
                interaction.reply({ content: "▶️ Música retomada.", ephemeral: true });
            }
        ],
        [
            "music-skip",
            async (interaction) => {
                const extendedClient = interaction.client as ExtendedClient;
                const queue = extendedClient.player.nodes.get(interaction.guildId!);
                if (!queue || !queue.isPlaying()) {
                    return interaction.reply({ content: "Nenhuma música está tocando.", ephemeral: true });
                }

                queue.node.skip();
                interaction.reply({ content: "⏭️ Música pulada.", ephemeral: true });
            }
        ],
        [
            "music-stop",
            async (interaction) => {
                const extendedClient = interaction.client as ExtendedClient;
                const queue = extendedClient.player.nodes.get(interaction.guildId!);
                if (!queue || !queue.isPlaying()) {
                    return interaction.reply({ content: "Nenhuma música está tocando.", ephemeral: true });
                }

                queue.node.stop();
                interaction.reply({ content: "⏹ Bot encerrado.", ephemeral: true });
            }
        ]
    ])
});
