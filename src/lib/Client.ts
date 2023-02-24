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

export class Client extends BaseClient {
    public commands = new Collection<string, CommandNamespace & { autowiredCategory: string }>();
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
                if (cmd && cmd.commandInfo.enabled) {
                    if (cmd.commandInfo.needsDefer) await interaction.deferReply();
                    cmd.handle({ client: this, interaction }).catch((err) => { Logger.error(err); });
                }
            }
        });
    }

    private validateCommandNamespace(cmd: unknown): boolean {
        if (cmd) {
            return (
                typeof cmd == "object" &&
                "commandInfo" in cmd &&
                typeof cmd["commandInfo"] == "object" &&
                "commandData" in cmd &&
                typeof cmd["commandData"] == "object" &&
                "handle" in cmd
            );
        } else return false;
    }

    public autowireCommands(commandsDir = "commands") {
        const commandsAbsolutePath = join(__dirname, "..", commandsDir);
        Logger.info(`Autowiring commands from ${commandsAbsolutePath}`);

        const commandGroups = readdirSync(commandsAbsolutePath);

        commandGroups.forEach(commandGroup => {
            const commandsInGroup = readdirSync(join(commandsAbsolutePath, commandGroup))
                .filter(cmd =>
                    cmd.endsWith(".command.ts") || cmd.endsWith(".command.js")
                );

            commandsInGroup.forEach(commandInGroup => {
                const cmdFile = join(commandsAbsolutePath, commandGroup) + "/" + commandInGroup;

                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const cmd = require(cmdFile) as CommandNamespace;

                if (this.validateCommandNamespace(cmd)) {
                    this.commands.set(cmd.commandData.name, {
                        autowiredCategory: commandGroup,
                        commandData: cmd.commandData,
                        commandInfo: cmd.commandInfo,
                        handle: cmd.handle
                    });
                    Logger.info(`Autowired command { ${commandGroup.toUpperCase()} ${cmd.commandData.name} }`);
                } else {
                    Logger.info(`Failed to autowire command ${cmdFile}, invalid exported props`);
                }
            });
        });
    }
}
