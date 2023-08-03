
const server = require("./src/server.js");

const httpServ = require('https');
const config =  require("./src/config.js")
const fs = require("fs")
const onRequest = require("./src/onRequest");
// 创建request请求监听器

(async () => {

    const processRequest = await onRequest();

    const app = httpServ.createServer({
        key: fs.readFileSync(__dirname + "/cert/" + config.key),
        cert: fs.readFileSync(__dirname + "/cert/" + config.cert)
    }, processRequest).listen(config.port);

    server.start({
        server: app
    });
})();
