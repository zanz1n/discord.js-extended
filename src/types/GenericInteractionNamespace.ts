import { Client } from "../Client.js";
import { 
    ApplicationCommandData,
    ButtonInteraction,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
} from "discord.js";

export enum GenericInteractionType {
    ButtonIntegrable = "BUTTON_INTEGRABLE"
}

export type ButtonIntegrableInteraction = ApplicationCommandData | ChatInputCommandInteraction | ButtonInteraction

export interface GenericInteractionProps {
    enabled: boolean
    type: GenericInteractionType
}

export interface GenericInteractionRunOpts<Singleton> {
    client: Client<Singleton>
    interaction: ButtonIntegrableInteraction
}

export type GenericInteractionData = ChatInputApplicationCommandData

export interface GenericInteractionNamespace {
    genericInteractionProps: GenericInteractionProps
    genericInteractionData: GenericInteractionData
    handle(opts: GenericInteractionRunOpts<any>): Promise<void>   
}
