#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { spawnSync } = require("child_process");
spawnSync("rm", ["-rf", "dist", "types"]);
