import { Command } from "../../structs/types/Command";
import {
    ApplicationCommandType,
    ChatInputCommandInteraction,
    EmbedBuilder
} from "discord.js";
import { db } from "../../database/mysql";

export default new Command({
    name: "gif",
    description: "Envia um gif aleatório da categoria especificada",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "categoria",
            description: "Categoria do gif (opcional)",
            type: 3, // STRING
            required: false
        }
    ],
    async run({ interaction }) {
        const categoria = (interaction as ChatInputCommandInteraction).options.getString("categoria");

        await interaction.deferReply();

        // 🔎 Busca GIF aleatório da categoria (ou qualquer um se não informar)
        const [rows] = await db.query(
            `
            SELECT * FROM media_files
            WHERE file_type = 'gif'
            ${categoria ? "AND category COLLATE utf8mb4_general_ci = ?" : ""}
            ORDER BY RAND() LIMIT 1
            `,
            categoria ? [categoria] : []
        );

        const result = (rows as any[])[0];

        if (!result) {
            return interaction.editReply({
                content: "❌ Nenhum GIF encontrado nessa categoria."
            });
        }

        // 📝 Registra o uso do GIF
        await db.query(
            `
            INSERT INTO media_usage (media_id, command_name, usage_count)
            VALUES (?, 'gif', 1)
            ON DUPLICATE KEY UPDATE usage_count = usage_count + 1
            `,
            [result.id]
        );

        // 🎨 Envia o GIF em um Embed (fica mais bonito que só a URL)
        const embed = new EmbedBuilder()
            .setTitle(`🎲 GIF aleatório ${categoria ? `da categoria "${categoria}"` : ""}`)
            .setImage(result.file_url)
            .setColor("Random");

        return interaction.editReply({ embeds: [embed] });
    }
});
