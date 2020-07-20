const server = require("./src/server.js");
const config = require(__dirname+"/config.json");
server.start({
    port: config.port
});