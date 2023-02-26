/* eslint-disable @typescript-eslint/no-var-requires */
const { spawnSync } = require("child_process");
spawnSync("rm", ["-rf", "dist"], { stdio: "inherit" });
const buildProcess = spawnSync("node", ["node_modules/.bin/tsc"], { stdio: "inherit" });
if (buildProcess.status !== 0) {
    console.log("TypeScript build failed");
    process.exit(buildProcess.status);
} else {
    console.log("TypeScript build succeeded");
    process.exit(0);
}
