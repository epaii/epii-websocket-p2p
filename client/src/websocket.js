
function wrapPromise(fun) {
    let outfun = fun;
    if (!fun) {
        let _ok = null;
        outfun = function (ret) {
            if (_ok) {
                _ok(ret);
            }
        }
        return [outfun, new Promise((ok, error) => {
            _ok = ok;
        })]
    } else {
        return [outfun, null];
    }
}
function getArgsNum(aaa) {
    const args = /\(\s*([\s\S]*?)\s*\)/.exec(aaa)[1];
    if (args.length == 0) return 0;
    return args.split(/\s*,\s*/).length;
}
class epii_websocket {
    constructor(url, epii_id, info = {}, onLogin = null) {
        this.ready_callbacks = [];
        this.url = url;
        this.epii_id = epii_id;
        this.epii_info = info;
        this.epii_servers = {};
        this.cbs = [];
        this.__on_error = null;

        this._close_by_self = false;
        this.onUserAvailable_cbs = {};
        this.heart_rate_runing = false;
        if (info.heart_rate) {
            this.heart_rate = info.heart_rate;
        } else {
            this.heart_rate = 30000;
        }
        this.onLogin = onLogin;
        setTimeout(() => {
            this._start();
        }, 100);
    }
    onLogin(fun) {
        this.onLogin = fun;
    }
    _pushcb(cb) {
        if (!cb) return -1;
        let l = this.cbs.length;
        this.cbs.push(cb);
        return l;
    }
    _heart_rate() {
        if (!this.heart_rate_runing) {
            this.heart_rate_runing = true;
            setInterval(() => {
                if (this.is_ready) {

                    this.ws.send(JSON.stringify({ hr: 1 }))
                }
            }, this.heart_rate);
        }
    }
    _start() {

        this.is_ready = false;
        this._close_by_self = false;
        if (typeof uni != "undefined") {
            this.ws = {};
        } else if ((typeof window === "object") && window.WebSocket) {
            this.ws = new WebSocket(this.url);
        } else if (typeof WebSocket === "undefined") {
            this.ws = new (require("ws"))(this.url);
        }

        this.ws.onclose = (e) => {
            if (!this._close_by_self)
                this._start();
        }
        this.ws.onopen = () => {

            let login = () => {
                this.send({
                    do: "login", id: this.epii_id, unique: this.epii_info["unique"] ? 1 : 0, info: this.epii_info, cb: this._pushcb((data) => {
                        //console.log(data);
                        if (data.code - 1 == 0) {
                            this.is_ready = true;
                            if (this.onLogin) this.onLogin();
                            this.ready_callbacks.forEach(cb => cb());
                            //增加心跳，否则总是自动断线
                            this._heart_rate();
                        } else {
                            if (this.__on_error) this.__on_error({ msg: "it is has exist username " + this.epii_id + " " });
                        }

                    })
                }, true);
            }
            if (this.epii_info.hasOwnProperty("__unique__") && (this.epii_info.__unique__ === 1)) {
                this.ping(this.epii_id, (ret) => {
                    if (ret.code - 1 == 0) {
                        if (this.__on_error) this.__on_error({ msg: "exist id " + this.epii_id });
                    } else {
                        login();
                    }
                })
            } else {
                login();
            }

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
        this.ws.onerror = (e) => {
            if (!this._close_by_self)
                setTimeout(() => {
                    this._start();
                }, 2000)

            if (this.__on_error) this.__on_error(e);
        }
        if (typeof uni != "undefined") {
            uni.onSocketOpen(this.ws.onopen);
            uni.onSocketError(this.ws.onerror);
            uni.onSocketMessage(this.ws.onmessage);
            uni.onSocketClose(this.ws.onclose);
            this.ws.send = function (data) {
                uni.sendSocketMessage({ data: data })
            }
            this.ws.close = function () {
                uni.closeSocket();
            }
            uni.connectSocket({
                url: this.url
            });
        }
    }

    onUserAvailable(userid, cb) {
        if (!this.onUserAvailable_cbs[userid]) {
            this.onUserAvailable_cbs[userid] = [];
        }
        this.onUserAvailable_cbs[userid].push(cb);
        this.send({ do: "onUserAvailable", toid: userid, id: this.epii_id });
    }

    regServer(name, handler) {
        this.epii_servers[name] = handler;
        this.send({ do: "regServer", name: name });
    }
    callServer(id, name, data, cb = null) {
        const [_cb, ret] = wrapPromise(cb);
        this.send({ do: "callServer", id: id, name: name, data: data, cb: this._pushcb(_cb) });
        if (ret) {
            return ret;
        }
    }
    async waitForServer(id, name, cb = null) {

        let sleep = function (time) { return new Promise(r => setTimeout(r, time)) };
        while (true) {
            const [_cb, ret] = wrapPromise(null);
            //console.log(ret);
            this.send({ do: "checkServer", id: id, name: name, data: {}, cb: this._pushcb(_cb) });
            let data = await ret;
            if (data.code - 1 === 0) {
                break;
            }
            await sleep(1000);
        }
        if (cb) {
            cb();
        }
    }

    async checkServer(id, name) {
        const [_cb, ret] = wrapPromise(null);
        //console.log(ret);
        this.send({ do: "checkServer", id: id, name: name, data: {}, cb: this._pushcb(_cb) });
        let data = await ret;
        return data.code - 1 === 0;
    }

    sendTo(id, name, data, cb = null) {
        const [_cb, ret] = wrapPromise(cb);
        this.send({ do: "callServer", id: id, name: name, more: 1, data: data, cb: this._pushcb(_cb) });
        if (ret) {
            return ret;
        }
    }
    ping(id, cb = null) {
        const [_cb, ret] = wrapPromise(cb);
        this.callServer(id, "__ping", { __ping: 1 }, _cb)
        if (ret) {
            return ret;
        }
    }
    exit() {
        this._close_by_self = true;
        this.ws.close();
    }
    close() {
        this.exit();
    }
    async __callServer(data) {
        if (this.epii_servers.hasOwnProperty(data.name)) {
            let onResult = (ret) => {
                if (data.cb - 1 != -2) {
                    if (ret instanceof Error) {
                        ret = {
                            $error_code: -200,
                            $error_msg: ret.message
                        }
                        //console.log(ret);
                    }
                    this.send({ do: "reponseCall", connect: data.connect, data: ret, cb: data.cb });
                }
            }
            const f = this.epii_servers[data.name];
            const req = { data: data.data, client: data.client };
            if (getArgsNum(f) == 2) {
                try {
                    await f(req, onResult)
                } catch (error) {

                    onResult(error)
                }

            } else {

                try {
                    onResult(await f(req))
                } catch (error) {
                    onResult(error)
                }
            }

        }
    }
    __callback(data) {
        if (this.cbs.hasOwnProperty(data.cb)) {
            //console.log(data);
            if (data.data && data.data.$error_code && (data.data.$error_code - 0 !== 0)) {
                this.cbs[data.cb](null, data.data);
            } else {
                this.cbs[data.cb](data.data, null);
            }
        }
    }
    __onUserAvailable(data) {
        if (this.onUserAvailable_cbs[data.id]) {
            delete data.do;
            this.onUserAvailable_cbs[data.id].forEach(cb => cb(data));
        }

    }

    send(data, noReady) {
        if (noReady) {
            this.ws.send(JSON.stringify(data))
        } else
            this.ready(() => {
                this.ws.send(JSON.stringify(data))
            });

    }
    isReady() {
        return this.is_ready;
    }
    ready(cb = null) {
        const [_cb, ret] = wrapPromise(cb);
        if (this.is_ready) {
            _cb();
        } else {
            this.ready_callbacks.push(_cb);
        }
        if (ret)
            return ret;
    }
    onError(cb) {
        this.__on_error = cb;
    }
}

module.exports = epii_websocket;

