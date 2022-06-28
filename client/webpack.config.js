const path = require("path")
module.exports = {
    mode: "production",//development
    entry: __dirname + "/src/websocket.js",
    output: {
        path: __dirname + "/dist",
        filename: "epii-websocket-p2p.js",
        library: "WebSocketP2P",
        libraryTarget: "umd",
        globalObject: 'this' 
    },
 
    externals: {
        ws:"ws"
    }
};