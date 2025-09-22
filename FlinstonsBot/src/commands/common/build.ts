import { Command } from "../../structs/types/Command";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    EmbedBuilder
} from "discord.js";

export default new Command({
    name: "build",
    description: "Mostra uma build por nome de campeão (ou a mais recente)",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "campeao",
            description: "Nome do campeão (ex: irelia, yasuo...)",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run({ client, interaction }) {
        const campeao = (interaction as ChatInputCommandInteraction).options.getString("campeao");

        await interaction.deferReply();

        try {
            let query = `
                SELECT * FROM media_files
                WHERE category = 'build' AND file_type = 'image'
            `;
            const params: any[] = [];

            if (campeao) {
                query += ` AND tags LIKE ?`;
                params.push(`%${campeao}%`);
            }

            
            query += ` ORDER BY created_at DESC LIMIT 1`;

            const [rows] = await client.db.query(query, params);
            const result = (rows as any[])[0];

            if (!result) {
                return interaction.editReply({
                    content: `❌ Nenhuma build encontrada ${campeao ? `para "${campeao}"` : ""}.`
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(result.file_name)
                .setDescription(result.description || "Build registrada.")
                .setImage(result.file_url)
                .setColor(0x00AE86)
                .setFooter({ text: `Categoria: ${result.category} | Tags: ${result.tags || "nenhuma"}` });

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error("Erro ao buscar build:", err);
            return interaction.editReply({
                content: "❌ Ocorreu um erro ao tentar buscar a build."
            });
        }
    }
});
