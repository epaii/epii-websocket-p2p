const App = require("epii-tiny-app");
const server = require("./server")

let c =  function (fun){
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
    return App.createServer().route("/notice", c("httpNotice") ).route("/callserver", c("httpCallServer")).route("/ping", c("httpPing")).callback();
}
