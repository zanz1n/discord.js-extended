import "dotenv/config";
import { DependencySingleton } from "./services/DependencySingleton";
import { Client } from "./lib/Client";

async function main() {
    const client = Client.createDefault<DependencySingleton>(process.env.DISCORD_TOKEN ?? "");

    client.useDependencySingleton(DependencySingleton.getInstance());

    client.autowireCommands("./commands");

    client.autowireEvents("./events");

    client.login();
}
main();
