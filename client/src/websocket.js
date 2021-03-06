
class epii_websocket {
    constructor(url, epii_id, info = {}) {
        this.ready_callbacks = [];
        this.url = url;
        this.epii_id = epii_id;
        this.epii_info = info;
        this.epii_servers = {};
        this.cbs = [];
        this.__on_error =null;
        this._start();
        this._close_by_self = false;
        this.onUserAvailable_cbs ={};
        this.heart_rate_runing = false;
        if(info.heart_rate){
            this.heart_rate = info.heart_rate;
        }else{
            this.heart_rate = 30000;
        }
    }
    _pushcb(cb) {
        if (!cb) return -1;
        let l = this.cbs.length;
        this.cbs.push(cb);
        return l;
    }
    _heart_rate(){
        if(!this.heart_rate_runing){
            this.heart_rate_runing = true;
            setInterval(() => {
                if(this.is_ready){
                    
                    this.ws.send(JSON.stringify({hr:1}))
                }
            }, this.heart_rate);
        }
    }
    _start() {
        
        this.is_ready = false;
        this._close_by_self = false;
        if (typeof uni != "undefined") {
            this.ws ={};
        }else if((typeof window === "object") && window.WebSocket){
            this.ws = new WebSocket(this.url);   
        }else if(typeof WebSocket === "undefined"){
            this.ws =  new  (require("ws"))(this.url); 
        }
 
        this.ws.onclose = (e) => {
            if(! this._close_by_self )
              this._start();
        }
        this.ws.onopen = () => {
 
            let login = ()=>{
                this.send({ do: "login", id: this.epii_id, unique:this.epii_info["unique"]?1:0,info: this.epii_info,cb:this._pushcb((data)=>{
                    if(data.code-1==0){
                         this.is_ready = true;
                         this.ready_callbacks.forEach(cb => cb());
                         //增加心跳，否则总是自动断线
                         this._heart_rate();
                    }else{
                        if(this.__on_error) this.__on_error({msg:"it is has exist username "+this.epii_id+" "}) ;  
                    }
                   
                }) },true);
            }
            if(this.epii_info.hasOwnProperty("__unique__") && ( this.epii_info.__unique__===1 ) ){
                this.ping(this.epii_id,(ret)=>{
                   if(ret.code-1==0)
                   {
                      if(this.__on_error) this.__on_error({msg:"exist id "+this.epii_id})      ; 
                   }else{
                    login();
                   }
                })   
           }else{
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
        this.ws.onerror = (e)=> {
              if(! this._close_by_self )
                setTimeout(()=>{
                    this._start();
                },2000)

              if(this.__on_error) this.__on_error(e)      ;
        }
        if (typeof uni != "undefined") {
              uni.onSocketOpen(this.ws.onopen);
              uni.onSocketError(this.ws.onerror);
              uni.onSocketMessage(this.ws.onmessage);
              uni.onSocketClose(this.ws.onclose); 
              this.ws.send =function(data){
                uni.sendSocketMessage({data:data})
              } 
              this.ws.close =function(){
                uni.closeSocket();
              } 
              uni.connectSocket({
                url: this.url
              });
        }
    }

    onUserAvailable(userid,cb){
        if(!this.onUserAvailable_cbs[userid])
        {
            this.onUserAvailable_cbs[userid] = [];
        }
        this.onUserAvailable_cbs[userid].push(cb);
        this.send({ do: "onUserAvailable", toid: userid ,id:this.epii_id});
    }
    
    regServer(name, handler) {
        this.epii_servers[name] = handler;
        this.send({ do: "regServer", name: name });
    }
    callServer(id, name, data, cb) {
        this.send({ do: "callServer", id: id, name: name, data: data, cb: this._pushcb(cb) });
    }
    sendTo(id, name, data, cb) {
        this.send({ do: "callServer", id: id, name: name,more:1, data: data, cb: this._pushcb(cb) });
    }
    ping(id,cb){
        this.callServer(id,"__ping",{__ping:1}, cb)
    }
    exit(){
        this._close_by_self = true;
        this.ws.close();
    }
    close(){
        this.exit();
    }
    __callServer(data) {
        if (this.epii_servers.hasOwnProperty(data.name)) {
                this.epii_servers[data.name]({ data: data.data, client: data.client }, (ret) => {
                    if (data.cb - 1 != -2) {
                        this.send({ do: "reponseCall", connect: data.connect, data: ret, cb: data.cb });
                    }
                })
        }
    }
    __callback(data) {
        if (this.cbs.hasOwnProperty(data.cb)) {
            this.cbs[data.cb](data.data);
        }
    }
    __onUserAvailable(data){
        if(this.onUserAvailable_cbs[data.id])
        {
            delete data.do;
             this.onUserAvailable_cbs[data.id].forEach(cb=>cb(data));
        }

    }

    send(data,noReady) {
        if(noReady){
            this.ws.send(JSON.stringify(data))
        }else 
        this.ready(()=>{
            this.ws.send(JSON.stringify(data))
        });
        
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
    onError(cb){
        this.__on_error = cb;
    }
}

module.exports = epii_websocket;

