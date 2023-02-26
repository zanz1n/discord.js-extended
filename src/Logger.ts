import debug from "debug";

export class Logger {
    public static debug = debug("bot:debug");
    public static info = debug("bot:info");
    public static warn = debug("bot:warn");
    public static error = debug("bot:error");
}
