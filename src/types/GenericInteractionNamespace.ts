import { Client } from "../Client.js";
import { 
    ApplicationCommandData,
    ButtonInteraction,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
    Interaction
} from "discord.js";

export enum GenericInteractionType {
    ButtonIntegrable = "BUTTON_INTEGRABLE"
}

export type ButtonIntegrableInteraction = ApplicationCommandData | ChatInputCommandInteraction | ButtonInteraction

export interface GenericInteractionProps {
    enabled: boolean
    type: GenericInteractionType
}

export interface GenericInteractionRunOpts<T extends Interaction, Singleton> {
    client: Client<Singleton>
    interaction: T
}

export type GenericInteractionData = ChatInputApplicationCommandData

export interface GenericInteractionNamespace {
    genericInteractionProps: GenericInteractionProps
    genericInteractionData: GenericInteractionData
    handle(opts: GenericInteractionRunOpts<Interaction, any>): Promise<void>   
}
