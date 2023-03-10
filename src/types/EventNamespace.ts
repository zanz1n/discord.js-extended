import { ClientEvents } from "discord.js";

type EventHandleFunc = (...args: any) => Promise<void>

export type NextFunction<T = any> = (agr: T, ...args: any) => Promise<void>

export interface EventProps {
    name: keyof ClientEvents
}

export interface EventNamespace {
    eventProps: EventProps
    handle: EventHandleFunc
}
