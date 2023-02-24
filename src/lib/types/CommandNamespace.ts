import { ChatInputApplicationCommandData } from "discord.js";
import { Client } from "../Client";
import { SlashCommandInteraction } from "./SlashCommandInteraction";

export interface CommandInfo {
    enabled: boolean
    needsDefer: boolean
}

export interface CommandRunOpts<T extends boolean> {
    client: Client
    interaction: SlashCommandInteraction<T>
}

export type CommandData = ChatInputApplicationCommandData

export interface CommandNamespace {
    commandInfo: CommandInfo
    commandData: CommandData
    handle(opts: CommandRunOpts<boolean>): Promise<void>
}
