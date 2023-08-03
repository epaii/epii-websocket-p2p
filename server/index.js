
const config = require("./src/config");
if (config.wss) {
    require(__dirname + "/wss.js")
} else {
    require(__dirname + "/ws.js")
}