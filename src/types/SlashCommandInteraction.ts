import { ChatInputCommandInteraction } from "discord.js";

export abstract class SlashCommandInteraction<Defered extends boolean = true> extends ChatInputCommandInteraction {
    public deferred: Defered;
}
