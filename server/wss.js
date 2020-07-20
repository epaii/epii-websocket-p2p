
const server = require("./src/server.js");

const httpServ = require('https');
const config = require(__dirname+"/config.json");
const fs = require("fs")
// 创建request请求监听器
const processRequest = (req, res) => {
    res.writeHead(200);
    res.end('WebSockets!\n');
};
 
const app = httpServ.createServer({
    key : fs.readFileSync(__dirname+"/cert/"+config.key),
    cert: fs.readFileSync(__dirname+"/cert/"+config.cert)
}, processRequest).listen(config.port);

server.start({
    server: app
});