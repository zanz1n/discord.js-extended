function reduce(arr, n) {
    for (let i = 0; i < n; i++) {
        arr.pop();
    }
}
/* eslint-disable @typescript-eslint/no-var-requires */
const { spawnSync } = require("child_process");
const exit = process.exit;
process.exit = (c) => {
    console.log(`Ts compilation exited with code ${c}`);
    if (c != 0) exit(c);
};
reduce(process.argv, 4);
require("./node_modules/.bin/tsc");
process.exit = exit;
let result;
if (process.argv.includes("--worker")) result = spawnSync("node", ["./dist/worker.js"], { stdio: "inherit" });
else result = spawnSync("node", ["./dist/index.js"], { stdio: "inherit" });
process.exit(result.status ?? 0);
