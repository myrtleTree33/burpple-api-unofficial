const fs = require("fs");

// Run this file to initialize env vars on first start
fs.createReadStream(".sample-env").pipe(fs.createWriteStream(".env"));
