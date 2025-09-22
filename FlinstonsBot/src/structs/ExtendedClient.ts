import {
    BitFieldResolvable,
    Client,
    Partials,
    GatewayIntentsString,
    IntentsBitField,
    Collection,
    ApplicationCommandDataResolvable,
    ClientEvents
} from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Player } from "discord-player";
import { CommandType, ComponentsButton, ComponentsModal, ComponentsSelect } from "./types/Command";
import { EventType } from "./types/Event";
import { SpotifyExtractor } from "@discord-player/extractor";
import { YoutubeiExtractor } from 'discord-player-youtubei';
import mysql from "mysql2/promise";
// Carregar variáveis de ambiente
dotenv.config();

// Verifica se o arquivo é .ts ou .js
const fileCondition = (fileName: string) => fileName.endsWith(".ts") || fileName.endsWith(".js");

export class ExtendedClient extends Client {
    public commands: Collection<string, CommandType> = new Collection();
    public buttons: ComponentsButton = new Collection();
    public selects: ComponentsSelect = new Collection();
    public modals: ComponentsModal = new Collection();
    public player: Player;

     public db = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: "Flintstones",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    constructor() {
        super({
            intents: Object.keys(IntentsBitField.Flags) as BitFieldResolvable<GatewayIntentsString, number>,
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.GuildScheduledEvent,
                Partials.Message,
                Partials.Reaction,
                Partials.ThreadMember,
                Partials.User
            ]
        });

        // Inicializa o player de música
        this.player = new Player(this);
        
    }

    public async start() {
        // Carrega os extractors padrão (YouTube, Spotify.)
        this.player.extractors.register(YoutubeiExtractor, {});
        this.player.extractors.register(SpotifyExtractor, {});
        
        

        // Registra comandos e eventos
        this.registerModules();
        this.registerEvents();

        // Inicia o bot
        await this.login(process.env.BOT_TOKEN);
    }

    private registerCommands(commands: Array<ApplicationCommandDataResolvable>) {
        this.application?.commands.set(commands)
        this.guilds.cache.get("1340773139155652760")?.commands.set(commands)
            .then(() => {
                console.log("✔ Slash commands (/) definidos com sucesso".green);
            })
            .catch(error => {
                console.error(`❌ Erro ao definir comandos: \n${error}`.red);
            });
    }

    private registerModules() {
        const slashCommands: Array<ApplicationCommandDataResolvable> = [];

        const commandsPath = path.join(__dirname, "..", "commands");

        fs.readdirSync(commandsPath).forEach(local => {
            fs.readdirSync(path.join(commandsPath, local))
                .filter(fileCondition)
                .forEach(async fileName => {
                    const command: CommandType = (await import(`../commands/${local}/${fileName}`))?.default;
                    const { name, buttons, selects, modals } = command;

                    if (name) {
                        this.commands.set(name, command);
                        slashCommands.push(command);

                        if (buttons) buttons.forEach((run, key) => this.buttons.set(key, run));
                        if (selects) selects.forEach((run, key) => this.selects.set(key, run));
                        if (modals) modals.forEach((run, key) => this.modals.set(key, run));
                    }
                });
        });

        this.on("ready", () => this.registerCommands(slashCommands));
    }

    private registerEvents() {
        const eventsPath = path.join(__dirname, "..", "events");

        fs.readdirSync(eventsPath).forEach(local => {
            fs.readdirSync(path.join(eventsPath, local))
                .filter(fileCondition)
                .forEach(async fileName => {
                    const { name, once, run }: EventType<keyof ClientEvents> = (await import(`../events/${local}/${fileName}`))?.default;

                    try {
                        if (name) (once ? this.once(name, run) : this.on(name, run));
                    } catch (error) {
                        console.error(`❌ Erro ao carregar evento: ${name} \n${error}`.red);
                    }
                });
        });
    }
}
