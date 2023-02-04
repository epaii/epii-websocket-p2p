const App = require("../src");


App.create().use(function (ctx, globalData) {

}).route("/test", function (ctx) {
    return ctx.params();
}).listen(8891)