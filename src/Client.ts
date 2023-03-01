import {
    Awaitable,
    BitFieldResolvable,
    Client as BaseClient,
    ClientEvents,
    ClientOptions,
    Collection,
    GatewayIntentBits,
    GatewayIntentsString,
    Interaction,
    REST,
    Routes,
    InteractionType
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Logger } from "./Logger.js";
import { CommandNamespace } from "./types/CommandNamespace.js";
import { EventNamespace } from "./types/EventNamespace.js";
import { GenericInteractionNamespace, GenericInteractionType } from "./types/GenericInteractionNamespace.js";
import chalk from "chalk";
import { InvalidNamespaceError } from "./types/InvalidNamespaceError.js";

type AutoWiredEventType<T extends EventNamespace | CommandNamespace | GenericInteractionNamespace> = {
    namespace: T
    wireType: "event" | "command" | "genericInteraction"
    wiredGroup: string
}

interface BaseClientEvents extends ClientEvents {
    autowiredEvent: [data: AutoWiredEventType<EventNamespace>]
    autowiredCommand: [data: AutoWiredEventType<CommandNamespace>]
    autowiredGenericInteraction: [data: AutoWiredEventType<GenericInteractionNamespace>]
}

export type ListenerCallback<K extends keyof BaseClientEvents> = (...args: BaseClientEvents[K]) => Awaitable<void>

export class Client<Singleton = any> extends BaseClient<true> {

    public on<K extends keyof BaseClientEvents>(event: K, listener: ListenerCallback<K>) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return super.on(event, listener);
    }

    public emit<K extends keyof BaseClientEvents>(event: K, ...args: BaseClientEvents[K]) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return super.emit(event, ...args);
    }

    public commands = new Collection<string, CommandNamespace & { autowiredCategory: string }>();
    public genericInteractions = new Collection<string, GenericInteractionNamespace & { autowiredCategory: string }>();

    public singleton: Singleton;

    private _token: string;
    private _postCommandsOnReady = false;

    private dirname = "";

    public forRootWiring(dir: string) { this.dirname = dir; }

    public static createDefault<Singleton>(token: string, intents?: BitFieldResolvable<GatewayIntentsString, number>) {
        return new Client<Singleton>({
            intents: intents ?? [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.AutoModerationConfiguration,
                GatewayIntentBits.AutoModerationExecution,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent
            ],
            token,
        });
    }

    private constructor(options: ClientOptions & { token: string }) {
        super(options);
        this._token = options.token;
    }

    public useDependencySingleton(singleton: Singleton) {
        this.singleton = singleton;
    }

    public login() {
        this.selfListenEvents();
        return super.login(this._token);
    }

    public postCommandsOnReady() {
        this._postCommandsOnReady = true;
    }

    public async postCommands() {
        const rest = new REST({ version: "10" }).setToken(this._token);

        const data = this.commands.map(cmd => cmd.commandData);

        rest.put(Routes.applicationCommands(this.application!.id), {
            body: data
        }).then(() => {
            Logger.info("Commands posted");
        }).catch((err) => {
            Logger.error(err);
        });
    }

    private nextS = {
        "interactionCreate": async(interaction: Interaction) => {
            const name: string | undefined = interaction["commandName"] ?? interaction["customId"];

            if (name) {
                const gint = this.genericInteractions.get(name);
                if (gint && gint.genericInteractionProps.enabled) {
                    if (gint.genericInteractionProps.type == GenericInteractionType.ButtonIntegrable) {
                        if (
                            interaction.type == InteractionType.ApplicationCommand ||
                            interaction.type == InteractionType.ApplicationCommandAutocomplete ||
                            interaction.type == InteractionType.MessageComponent
                        ) {
                            gint.handle({ client: this, interaction }).catch((err) => { Logger.error(err); });
                        }
                    }
                }
            }

            if (interaction.isChatInputCommand()) {
                const cmd = this.commands.get(interaction.commandName);
                if (cmd && cmd.commandProps.enabled) {
                    if (cmd.commandProps.needsDefer) await interaction.deferReply();
                    cmd.handle({ client: this, interaction }).catch((err) => { Logger.error(err); });
                }
            }
        },
        "ready": async(c: Client<unknown>) => {
            Logger.info("Logged in as " + c.user.tag);
            if (this._postCommandsOnReady) this.postCommands();
        }
    };

    private async selfListenEvents() {
        this.on("autowiredEvent", ({ namespace, wiredGroup }) => {
            Logger.info(`Autowired event { ${wiredGroup} ${namespace.eventProps.name} }`);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            this.on(namespace.eventProps.name, (evt) => { namespace.handle(evt, this.nextS[namespace.eventProps.name]); });
        });

        this.on("autowiredCommand", ({ namespace, wiredGroup }) => {
            Logger.info(`Autowired command { ${wiredGroup} ${namespace.commandData.name} }`);
            this.commands.set(namespace.commandData.name, { ...namespace, autowiredCategory: wiredGroup });
        });

        this.on("autowiredGenericInteraction", ({ namespace, wiredGroup }) => {
            Logger.info(`Autowired interaction { ${wiredGroup} ${namespace.genericInteractionData.name} }`);
            this.genericInteractions.set(namespace.genericInteractionData.name, { ...namespace, autowiredCategory: wiredGroup });
        });
    }

    private validateNamespace(type: string, namespace: unknown): boolean {
        if (type == "command") return this.validateNamespace__command(namespace);
        else if (type == "event") return this.validateNamespace__event(namespace);
        else if (type == "genericInteraction") return this.validateNamespace__genericInteraction(namespace);
        else throw new InvalidNamespaceError(type);
    }

    private validateNamespace__command(cmd: unknown): boolean {
        if (cmd) {
            return (
                typeof cmd == "object" &&
                "commandProps" in cmd &&
                typeof cmd["commandProps"] == "object" &&
                "commandData" in cmd &&
                typeof cmd["commandData"] == "object" &&
                "handle" in cmd
            );
        } else return false;
    }

    private validateNamespace__event(evt: unknown): boolean {
        if (evt) {
            return (
                typeof evt == "object" &&
                "eventProps" in evt &&
                typeof evt["eventProps"] == "object" &&
                "handle" in evt
            );
        }
        else return false;
    }

    private validateNamespace__genericInteraction(gcmd: unknown): boolean {
        if (gcmd) {
            return (
                typeof gcmd == "object" &&
                "genericInteractionProps" in gcmd &&
                typeof gcmd["genericInteractionProps"] == "object" &&
                "handle" in gcmd
            );
        }
        else return false;
    }

    private autowireSomething(wireType: "command" | "event" | "genericInteraction", wireDir: string) {
        const wiredAbsolutePath = join(this.dirname, wireDir);

        Logger.info(`Autowiring ${wireType}s from ${wiredAbsolutePath}`);

        const wiredGroups = readdirSync(wiredAbsolutePath);

        wiredGroups.forEach(wiredGroup => {
            const wiredInGroup = readdirSync(join(wiredAbsolutePath, wiredGroup))
                .filter(cmd =>
                    cmd.endsWith(`.${wireType}.ts`) || cmd.endsWith(`.${wireType}.js`)
                );

            wiredInGroup.forEach(async wiredInGroup => {
                const wiredFile = join(wiredAbsolutePath, wiredGroup, wiredInGroup);

                try {
                    const wired = await import(wiredFile);

                    const wiredModule = wired.default ?? wired;

                    if (this.validateNamespace(wireType, wiredModule)) {
                        if (wireType == "command") {
                            this.emit("autowiredCommand", {
                                namespace: wiredModule,
                                wiredGroup: wiredGroup.toUpperCase(),
                                wireType: wireType,
                            });
                        } else if (wireType == "event") {
                            this.emit("autowiredEvent", {
                                namespace: wiredModule,
                                wiredGroup: wiredGroup.toUpperCase(),
                                wireType: wireType,
                            });
                        } else if (wireType == "genericInteraction") {
                            this.emit("autowiredGenericInteraction", {
                                namespace: wiredModule,
                                wiredGroup: wiredGroup.toUpperCase(),
                                wireType: wireType,
                            });
                        }
                    }
                    else throw new InvalidNamespaceError(`Invalid ${wireType} namespace format, make sure to export the props properly`);
                } catch(err) {
                    Logger.error(
                        chalk.bgRed(`Error while autowiring ${wireType} from ${wiredFile.replace(wiredAbsolutePath + "/", "")}\n\t`)
                        +
                        chalk.red(
                            `${err.name}: ${err.message}\n\t` +
                            "The module may not be exported properly or contain an error"
                        )
                    );
                }
            });
        });
    }

    public autowireCommands(commandsDir = "./commands") {
        const result = this.autowireSomething("command", commandsDir);
        return result;
    }

    public autowireEvents(eventDir = "./events") {
        return this.autowireSomething("event", eventDir);
    }

    public autowireInteractions(interactionDir = "./interactions") {
        return this.autowireSomething("genericInteraction", interactionDir);
    }
}
