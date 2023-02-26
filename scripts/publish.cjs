#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { spawnSync } = require("child_process");
spawnSync("node", ["scripts/build.cjs"], { stdio: "inherit" });
spawnSync("npm", ["--scope=@zanz1n", "--access", "public"]);
