const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server;
Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};
let connections = [];
let handler = {
    connections: {},
    httpReqs: [],
    httpCallServerCount: 0,
    onUserAvailable_cbs: {},
    login(ws, data) {
        if (!data.info) data.info = {};
        data.info.epii_id = data.id;
        if (!this.connections.hasOwnProperty(data.id)) {
            this.connections[data.id] = { id: data.id, info: data.info, ws: [] };
        }
        if (data.hasOwnProperty("unique") && (data.unique - 1 === 0)) {
            if (this.connections[data.id].ws.length > 0) {
                this._callback(ws, data.cb, { code: 0 })
                return;
            }
        }

        if (this.connections[data.id].ws.indexOf(ws) == -1) {
            ws.epii_id = data.id;
            ws.epii_index = this.connections[data.id].ws.length;
            this.connections[data.id].ws.push(ws);
        }
        if (data.hasOwnProperty("cb"))
            this._callback(ws, data.cb, { code: 1 })

        this.__onUserAvailable(data.id);


    },
    logout(ws) {
        if (ws.hasOwnProperty("epii_id")) {
            if (this.connections.hasOwnProperty(ws.epii_id)) {
                this.connections[ws.epii_id].ws.remove(ws);
                if (this.connections[ws.epii_id].ws.length === 0) {
                    delete this.connections[ws.epii_id];
                }
            }

        }
        this.__onUserAvailable(ws.epii_id);

    },
    httpNotice(id, server_name, data = {}) {
        if (!(id && server_name)) {
            throw new Error("参数格式错误")
        }
        return this.callServer(null, {
            id,
            name: server_name,
            data, more: 1,
            cb: -1
        })
    },
    httpKillUser(id) {
        let num = 0;
        if (this.connections.hasOwnProperty(id)) {
            num = this.connections[id].ws.length;
            delete this.connections[id];
        }
        return num;
    },
    httpPing(id) {
        return this.httpNotice(id, "__ping");
    },
    httpCallServer(id, server_name, data) {
        if (!(id && server_name)) {
            throw new Error("参数格式错误")
        }
        return new Promise((resolve) => {
            this.httpCallServerCount++;
            if (this.httpCallServerCount - 0 > 1000000000) {
                this.httpCallServerCount = 0;
            }
            let cnum = this.httpCallServerCount;
            this.httpReqs[cnum] = resolve;
            return this.callServer({
                epii_connection_index: -2,
            }, {
                id,
                name: server_name,
                data,
                cb: cnum
            })
        })

    },
    checkServer(ws, data) {
        if (data.hasOwnProperty("id") && data.hasOwnProperty("name")) {
            let id = data.id;
            let server_name = data.name;
            let towses = this._findWsFormServer(id, server_name);
            let ok = towses.length > 0;
            return this._callback(ws, data.cb, { code: ok ? 1 : 0 })
        }
    },
    callServer(ws, data) {
        if (ws === null) {
            ws = {
                epii_connection_index: -1,
                more: 1
            }
        }

        if (data.hasOwnProperty("id") && data.hasOwnProperty("name")) {

            let id = data.id;
            let server_name = data.name;
            let ping = (server_name == "__ping");
            if (ping) {
                let ok = this.connections.hasOwnProperty(id) && (this.connections[id].ws.length > 0);
                return this._callback(ws, data.cb, { code: ok ? 1 : 0 })

            }



            let towses = this._findWsFormServer(id, server_name);



            if (data.hasOwnProperty("more") && (data.more - 1 === 0)) {
                towses.forEach(tows => {
                    if (tows && tows.epii_is_ok) {
                        let string = JSON.stringify({ do: "__callServer", name: server_name, data: data.data, client: this.connections[ws.epii_id].info, connect: ws.epii_connection_index, cb: -1 });
                        tows.send(string);
                    }
                })
                return this._callback(ws, data.cb, { num: towses.length });
            }
            let tows = towses[0];
            if (tows && tows.epii_is_ok) {
                let string = JSON.stringify({ do: "__callServer", name: server_name, data: data.data, client: this.connections[ws.epii_id].info, connect: ws.epii_connection_index, cb: data.cb });
                tows.send(string);
            } else {
                this.reponseCall(null, {
                    connect: ws.epii_connection_index,
                    cb: data.cb,
                    data: {
                        $error_code: -100,
                        $error_msg: "server is not able"
                    }
                });
            }
            return true;


        }
    },
    reponseCall(ws, data) {

        if (data.hasOwnProperty("connect") && data.hasOwnProperty("cb")) {
            if (data.data && !data.data.hasOwnProperty("$error_code")) {
                data.data.$error_code = 0;
            }
            if (connections.hasOwnProperty(data["connect"])) {

                let tows = connections[data["connect"]];
                if (tows && tows.epii_is_ok) {

                    this._callback(tows, data.cb, data.data);
                }
            } else if (data["connect"] - 2 === -4) {
                if (this.httpReqs[data["cb"] - 0]) {
                    this.httpReqs[data["cb"] - 0](data.data);
                    delete this.httpReqs[data["cb"] - 0];
                }
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
    onUserAvailable(ws, data) {
        if (!this.onUserAvailable_cbs[data.toid]) {
            this.onUserAvailable_cbs[data.toid] = [];
        }
        if (!this.onUserAvailable_cbs[data.toid].includes(data.id + "")) {
            this.onUserAvailable_cbs[data.toid].push(data.id + "")
        }

        let string = JSON.stringify({ do: "__onUserAvailable", id: data.toid, code: this.connections.hasOwnProperty(data.toid) && (this.connections[data.toid].ws.length > 0) ? 1 : 0 });
        ws.send(string);

    },
    __onUserAvailable(epii_id) {
        if (!this.onUserAvailable_cbs[epii_id]) return;

        let code = -1;
        if (this.connections.hasOwnProperty(epii_id) && (this.connections[epii_id].ws.length === 1)) {
            code = 1;
        } else if (!this.connections[epii_id]) {
            code = 0;
        }
        if (code !== -1) {
            this.onUserAvailable_cbs[epii_id].forEach((name) => {
                let towses = this._findWsFormServer(name, null);
                towses.forEach(tows => {
                    if (tows && tows.epii_is_ok) {
                        let string = JSON.stringify({ do: "__onUserAvailable", id: epii_id, code: code });
                        tows.send(string);
                    }
                })
            });
        }
    },

    _callback(ws, cb, data) {
        if (!ws) return data;
        if (ws.epii_connection_index - 1 == -2) return data;

        ws.send(JSON.stringify({ do: "__callback", cb: cb, data: data }));
    }
    ,
    _findWsFormServer(epii_id, name) {
        let out = [];
        if (this.connections.hasOwnProperty(epii_id) && (this.connections[epii_id].ws.length > 0)) {
            let l = this.connections[epii_id].ws.length;
            let i = l - 1;

            for (; i >= 0; i--) {

                if ((name === null) || this.connections[epii_id].ws[i].epii_servers.includes(name)) {
                    out.push(this.connections[epii_id].ws[i]);
                }
            }
        }
        return out
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
        ws.on('error', function () {
            console.log("on error");
        });
    })
}



module.exports = {
    start: start,
    handler: handler
};