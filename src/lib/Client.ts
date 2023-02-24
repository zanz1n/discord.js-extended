import {
    BitFieldResolvable,
    Client as BaseClient,
    ClientOptions,
    Collection,
    GatewayIntentBits,
    GatewayIntentsString,
    REST,
    Routes
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Logger } from "./Logger";
import { CommandNamespace } from "./types/CommandNamespace";
import { EventNamespace } from "./types/EventNamespace";

export class Client extends BaseClient {
    public commands = new Collection<string, CommandNamespace & { autowiredCategory: string }>();
    public events = new Collection<string, EventNamespace & { autowiredCategory: string }>();
    private _token: string;

    public static createDefault(token: string, intents?: BitFieldResolvable<GatewayIntentsString, number>) {
        return new Client({
            intents: intents ?? [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.AutoModerationConfiguration,
                GatewayIntentBits.AutoModerationExecution,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers
            ],
            token,
        });
    }

    private constructor(options: ClientOptions & { token: string }) {
        super(options);
        this._token = options.token;
    }

    login() {
        this.selfListenEvents();
        this.selfListenInteractions();
        this.once("ready", () => { Logger.info("Logged in as " + this.user!.tag); });
        return super.login(this._token);
    }

    public async postCommands() {
        this.once("ready", async() => {
            const rest = new REST({ version: "10" }).setToken(this._token);

            const data = this.commands.map(cmd => cmd.commandData);

            rest.put(Routes.applicationCommands(this.application!.id), {
                body: data
            }).then(() => {
                Logger.info("Commands posted");
            }).catch((err) => {
                Logger.error(err);
            });
        });
    }

    private async selfListenInteractions() {
        this.on("interactionCreate", async(interaction) => {
            if (interaction.isChatInputCommand()) {
                const cmd = this.commands.get(interaction.commandName);
                if (cmd && cmd.commandProps.enabled) {
                    if (cmd.commandProps.needsDefer) await interaction.deferReply();
                    cmd.handle({ client: this, interaction }).catch((err) => { Logger.error(err); });
                }
            }
        });
    }

    private async selfListenEvents() {
        this.events.forEach(evt => {
            this.on(evt.eventProps.name, evt.handle);
        });
    }

    private validateCommandNamespace(cmd: unknown): boolean {
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

    private validateEventNamespace(evt: unknown): boolean {
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

    private autowireSomething(wireType: "command" | "event", wireDir: string) {
        const wiredAbsolutePath = join(__dirname, "..", wireDir);

        Logger.info(`Autowiring ${wireType} from ${wiredAbsolutePath}`);

        const wiredGroups = readdirSync(wiredAbsolutePath);

        wiredGroups.forEach(wiredGroup => {
            const commandsInGroup = readdirSync(join(wiredAbsolutePath, wiredGroup))
                .filter(cmd =>
                    cmd.endsWith(`.${wireType}.ts`) || cmd.endsWith(`.${wireType}.js`)
                );

            commandsInGroup.forEach(wiredInGroup => {
                const wiredFile = join(wiredAbsolutePath, wiredGroup) + "/" + wiredInGroup;

                if (wireType == "command") {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const cmd = require(wiredFile) as CommandNamespace;

                    if (this.validateCommandNamespace(cmd)) {
                        this.commands.set(cmd.commandData.name, {
                            autowiredCategory: wiredGroup,
                            commandData: cmd.commandData,
                            commandProps: cmd.commandProps,
                            handle: cmd.handle
                        });
                        Logger.info(`Autowired command { ${wiredGroup.toUpperCase()} ${cmd.commandData.name} }`);
                    } else {
                        Logger.error(`Failed to autowire command ${wiredFile}, invalid exported props`);
                    }
                }
                else if (wireType == "event") {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const evt = require(wiredFile) as EventNamespace;

                    if (this.validateEventNamespace(evt)) {
                        this.events.set(evt.eventProps.name, {
                            autowiredCategory: wiredGroup,
                            eventProps: evt.eventProps,
                            handle: evt.handle
                        });
                        Logger.info(`Autowired event { ${wiredGroup.toUpperCase()} ${evt.eventProps.name} }`);
                    } else {
                        Logger.error(`Failed to autowire event ${wiredFile}, invalid exported props`);
                    }
                }
            });
        });
    }

    public autowireCommands(commandsDir = "./commands") {
        return this.autowireSomething("command", commandsDir);
    }

    public autowireEvents(eventDir = "./events") {
        return this.autowireSomething("event", eventDir);
    }
}