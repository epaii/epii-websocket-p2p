const App = require("epii-tiny-app");
const server = require("./server")

let c = function (fun) {
    return async function (ctx) {
        let id = ctx.params("id");
        let server_name = ctx.params("server_name");
        let data = ctx.params();
        delete data.id;
        delete data.server_name;

        return await server.handler[fun](id, server_name, data);
    }
}

module.exports = async function () {
    return App.createServer().use(function (ctx, globalData) {
        ctx.res.setHeader("Access-Control-Allow-Origin", "*");
        ctx.res.setHeader("Access-Control-Allow-Headers", "X-request-With,content-type");
        ctx.res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS")
    }).route("/notice", c("httpNotice")).route("/callserver", c("httpCallServer")).route("/ping", c("httpPing")).route("/killUser", c("httpKillUser")).callback();
}
