!function(e,s){"object"==typeof exports&&"object"==typeof module?module.exports=s(require("ws")):"function"==typeof define&&define.amd?define(["ws"],s):"object"==typeof exports?exports.WebSocketP2P=s(require("ws")):e.WebSocketP2P=s(e.ws)}(this,(function(e){return s={629:(e,s,t)=>{e.exports=class{constructor(e,s,t={}){this.ready_callbacks=[],this.url=e,this.epii_id=s,this.epii_info=t,this.epii_servers={},this.cbs=[],this.__on_error=null,this._start(),this._close_by_self=!1}_pushcb(e){if(!e)return-1;let s=this.cbs.length;return this.cbs.push(e),s}_start(){this.is_ready=!1,this._close_by_self=!1,"undefined"!=typeof uni?this.ws={}:"object"==typeof window&&window.WebSocket?this.ws=new WebSocket(this.url):"undefined"==typeof WebSocket&&(this.ws=new(t(439))(this.url)),this.ws.onclose=e=>{this._close_by_self||this._start()},this.ws.onopen=()=>{this.send({do:"login",id:this.epii_id,info:this.epii_info}),this.is_ready=!0,this.ready_callbacks.forEach((e=>e()))},this.ws.onmessage=e=>{try{let s=JSON.parse(e.data);s.hasOwnProperty("do")&&this[s.do]&&this[s.do](s)}catch(e){console.log(e)}},this.ws.onerror=e=>{this._close_by_self||setTimeout((()=>{this._start()}),2e3),this.__on_error&&this.__on_error(e)},"undefined"!=typeof uni&&(uni.onSocketOpen(this.ws.onopen),uni.onSocketError(this.ws.onerror),uni.onSocketMessage(this.ws.onmessage),uni.onSocketClose(this.ws.onclose),this.ws.send=function(e){uni.sendSocketMessage({data:e})},this.ws.close=function(){uni.closeSocket()},uni.connectSocket({url:this.url}))}regServer(e,s){this.epii_servers[e]=s,this.send({do:"regServer",name:e})}callServer(e,s,t,i){this.send({do:"callServer",id:e,name:s,data:t,cb:this._pushcb(i)})}sendTo(e,s,t,i){this.send({do:"callServer",id:e,name:s,more:1,data:t,cb:this._pushcb(i)})}ping(e,s){this.callServer(e,"__ping",{__ping:1},s)}exit(){this._close_by_self=!0,this.ws.close()}close(){this.exit()}__callServer(e){this.epii_servers.hasOwnProperty(e.name)&&this.epii_servers[e.name]({data:e.data,client:e.client},(s=>{e.cb-1!=-2&&this.send({do:"reponseCall",connect:e.connect,data:s,cb:e.cb})}))}__callback(e){this.cbs.hasOwnProperty(e.cb)&&this.cbs[e.cb](e.data)}send(e){this.ws.send(JSON.stringify(e))}isReady(){return this.is_ready}ready(e){this.is_ready?e():this.ready_callbacks.push(e)}onError(e){this.__on_error=e}}},439:s=>{"use strict";s.exports=e}},t={},function e(i){if(t[i])return t[i].exports;var o=t[i]={exports:{}};return s[i](o,o.exports,e),o.exports}(629);var s,t}));