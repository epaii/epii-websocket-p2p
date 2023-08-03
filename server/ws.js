const server = require("./src/server.js");
const config = require("./src/config.js")
const http = require("http");

const onRequest = require("./src/onRequest");


(async () => {

    const processRequest = await onRequest();
    const app = http.createServer(processRequest).listen(config.port);
    server.start({
        server: app
    });
    console.log("start at port " + config.port);
})();