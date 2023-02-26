#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { spawnSync } = require("child_process");
const packageJson = require("../package.json");
const { writeFileSync } = require("fs");
const { join } = require("path");

let version = process.argv.find((arg) => arg.startsWith("--version="))?.replace("--version=", "");

if (!version) {
    console.error("No version specified");
    process.exit(1);
}

const buildProcess = spawnSync("node", ["scripts/build.cjs"], { stdio: "inherit" });
if (buildProcess.status !== 0) {
    console.log("Build failed");
    process.exit(buildProcess.status);
}

packageJson.version = version;
writeFileSync(join(__dirname, "..", "package.json"), JSON.stringify(packageJson, null, 2) + "\n");

const publishProcess = spawnSync(process.env.SHELL ?? "sh", ["scripts/pub_cmd.sh"], { stdio: "inherit" });
if (publishProcess.status !== 0) {
    console.log("Publish failed");
    process.exit(buildProcess.status);
}
