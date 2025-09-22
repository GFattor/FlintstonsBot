import { ExtendedClient } from "./structs/ExtendedClient"
export * from "colors";
import config from "./config.json"
import fs from "fs"
import path from "path"

process.env.BOT_TOKEN

const client = new ExtendedClient()

client.start()

client.on("ready", () => {
    console.log("Bot online".green)
})

client.on("messageCreate", (message) => {
    if (message.author.id == client.user?.id) return

    if(message.content === "ola") {
        message.reply({
            content: `Ola ${message.author.username}`
        })
        
    }

    if(message.content === "truco") {
        message.reply({
            content: `SEEEEEEEISS!`
        })
        
    }
    
})

client.on("messageCreate", (message) => {
    if(message.content === "ping") {
        message.reply("poggers")
    }
})

export{ client, config }