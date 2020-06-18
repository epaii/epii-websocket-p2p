const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server;
Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};
let connections =[];
let handler = {
    connections: {},
    login(ws, data) {
        if (!this.connections.hasOwnProperty(data.id)) {
            this.connections[data.id] = { id: data.id, info: data.info, ws: [] };
        }
        if (this.connections[data.id].ws.indexOf(ws) == -1) {
            ws.epii_id = data.id;
            ws.epii_index = this.connections[data.id].ws.length;
            this.connections[data.id].ws.push(ws);
        }

    },
    logout(ws) {
        if (ws.hasOwnProperty("epii_id")) {
            if (this.connections.hasOwnProperty(ws.epii_id)) {
                this.connections[ws.epii_id].ws.remove(ws);
            }
            if (this.connections[ws.epii_id].ws.length === 0) {
                delete this.connections[ws.epii_id];
            }
        }


    },
    callServer(ws, data) {
     
        if (data.hasOwnProperty("id") && data.hasOwnProperty("name")) {
            let id = data.id;
            let server_name = data.name;
            let tows = this._findWsFormServer(id,server_name);
           
            if(tows){
        
                let string = JSON.stringify({do:"__callServer",name:server_name,data:data.data,client:this.connections[id].info,connect:ws.epii_connection_index,cb:data.cb});
                tows.send(string);
            }
        }
    },
    reponseCall(ws, data) {
        if (data.hasOwnProperty("connect") && data.hasOwnProperty("cb") && connections.hasOwnProperty(data["connect"])) {
            let tows = connections[data["connect"]];
            
            if(tows && tows.epii_is_ok){
                this._callback(tows,data.cb,data.data);
            }
        }
    },
    regServer(ws, data) {
       
        ws.epii_servers.push(data.name);
    },
    test(ws, data) {
        console.log("testst:" + ws.epii_id);
    },
    showinfo() {
       // console.log(this.connections);
    },
    _callback(ws,cb,data){
        ws.send(JSON.stringify({do:"__callback",cb:cb,data:data}));
    }
    ,
    _findWsFormServer(epii_id, name) {

        if (this.connections.hasOwnProperty(epii_id) && this.connections[epii_id].ws.length > 0) {
            let l = this.connections[epii_id].ws.length;
            let i = l - 1;
            for (; i >= 0; i++) {
                if (this.connections[epii_id].ws[i].epii_servers.includes(name)) {
                    return this.connections[epii_id].ws[i];
                }
            }
        }
        return null;
    }

}
function start(options) {

    const wss = new WebSocketServer(options)
    wss.on('connection', (ws) => {     
        ws.epii_is_ok = true;
        ws.epii_servers = [];
        ws.epii_connection_index = connections.length;
        connections.push(ws);
        ws.on('message', function (message) {
            try {
               
                const data = JSON.parse(message);
                //console.log(data)
                if (data.hasOwnProperty("do") && handler.hasOwnProperty(data.do)) {
                    handler[data["do"]](ws, data);
                }
                handler.showinfo();

            } catch (error) {

            }
        });
        ws.on('close', function () {
            ws.epii_is_ok = false;
            handler.logout(ws);
            handler.showinfo();
        });
    })
}



module.exports = {
    start: start
};