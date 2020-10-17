
let WebSocketP2P = require(__dirname+"/../src/websocket.js")

let    test_server = new WebSocketP2P("ws://127.0.0.1:4897", "user_1", {
    name: "李四"
});

test_server.ready(function(){
    test_server.regServer("server1", function (data, callback) {
        console.log("asfasdfasdf")
        callback({
            "code": Math.random()
        })
    })
});

