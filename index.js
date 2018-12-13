#!/usr/bin/env node
const fs = require('fs-extra');
fs.copySync(process.argv[1].replace("bin/create-statik-site", "lib/node_modules/create-statik-site/_copy"), process.argv[2]);
console.log(" ");
console.log(process.argv[2] + " created in " + process.cwd() + "/" + process.argv[2]);
console.log(" ");
console.log("to get started simply...");
console.log(" ");
console.log("cd " + process.argv[2]);
console.log("npm install");
console.log("npm run build");
console.log("npm run start");
console.log(" ");