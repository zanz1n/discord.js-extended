import { Client } from "../Client.js";
import { 
    AnySelectMenuInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction,
} from "discord.js";

export enum GenericInteractionType {
    ButtonIntegrable = "BUTTON_INTEGRABLE"
}

export type ButtonIntegrableInteraction =
    ChatInputCommandInteraction |
    MessageContextMenuCommandInteraction |
    UserContextMenuCommandInteraction |
    AnySelectMenuInteraction |
    ButtonInteraction |
    AutocompleteInteraction

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
