
const fs = require("fs");

let config = {
    wss: false,
    port: 4897
}

let config_file = __dirname + "/../config.json";
if (!fs.existsSync(config_file)) {
    config_file = process.cwd() + "/config.json";
}

if (fs.existsSync(config_file)) {
    config = Object.assign(config, require(config_file))

}

module.exports = config;