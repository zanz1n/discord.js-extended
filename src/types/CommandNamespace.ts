import { ChatInputApplicationCommandData } from "discord.js";
import { Client } from "../Client.js";
import { SlashCommandInteraction } from "./SlashCommandInteraction.js";

export interface CommandProps {
    enabled: boolean
    needsDefer: boolean
}

export interface CommandRunOpts<T extends boolean, Singleton> {
    client: Client<Singleton>
    interaction: SlashCommandInteraction<T>
}

export type CommandData = ChatInputApplicationCommandData

export interface CommandNamespace {
    commandProps: CommandProps
    commandData: CommandData
    handle(opts: CommandRunOpts<boolean, any>): Promise<void>
}
