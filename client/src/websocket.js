let tasks = [];
let is_do_task = false;
function doTask(task) {
    tasks.push(task);
    if (!is_do_task) _doTask();
}

function _doTask() {

    if (tasks.length > 0) {
        is_do_task = true;
        let _run = tasks.shift();
        setTimeout(() => {
            _run(() => {
                is_do_task = false;
                _doTask();
            })
        }, 10);

    }
}

 
class epii_websocket {
    constructor(url, epii_id, info = {}) {
        this.ready_callbacks = [];
        this.url = url;
        this.epii_id = epii_id;
        this.epii_info = info;
        this.epii_servers = {};
        this.cbs = [];
        this._start();
    }
    _pushcb(cb) {
        if (!cb) return -1;
        let l = this.cbs.length;
        this.cbs.push(cb);
        return l;
    }
    _start() {
        
        this.is_ready = false;
     
        if(typeof WebSocket === "undefined"){
            this.ws =  new  (require("ws"))(this.url); 
        }else{
            this.ws = new WebSocket(this.url);   
        }
 
        this.ws.onclose = () => {
            this._start();
        }
        this.ws.onopen = () => {
            this.send({ do: "login", id: this.epii_id, info: this.epii_info });
            this.is_ready = true;
            this.ready_callbacks.forEach(cb => cb());
        };
        this.ws.onmessage = (e) => {
            try {

                let data = JSON.parse(e.data)

                if (data.hasOwnProperty("do") && this[data.do]) {

                    this[data.do](data);
                }
            } catch (error) {
                console.log(error);
            }

        }
        this.ws.onerror = (e)=> {
                
        }
    }
    regServer(name, handler) {
        this.epii_servers[name] = handler;
        this.send({ do: "regServer", name: name });
    }
    callServer(id, name, data, cb) {
        this.send({ do: "callServer", id: id, name: name, data: data, cb: this._pushcb(cb) });
    }
    ping(id,cb){
        this.callServer(id,"__ping",{__ping:1}, cb)
    }
    __callServer(data) {
        if (this.epii_servers.hasOwnProperty(data.name)) {
            doTask((ok) => {
                this.epii_servers[data.name]({ data: data.data, client: data.client }, (ret) => {
                    if (data.cb - 1 != -2) {
                        this.send({ do: "reponseCall", connect: data.connect, data: ret, cb: data.cb });
                    }

                    ok();
                })
            });
        }
    }
    __callback(data) {
        if (this.cbs.hasOwnProperty(data.cb)) {
            this.cbs[data.cb](data.data);
        }
    }
    send(data) {
        this.ws.send(JSON.stringify(data))
    }
    isReady() {
        return this.is_ready;
    }
    ready(cb) {
        if (this.is_ready) {
            cb();
        } else {
            this.ready_callbacks.push(cb);
        }
    }
}

module.exports = epii_websocket;

