const config = require(__dirname+"/config.json");
if(config.wss){
    require(__dirname+"/wss.js")
}else{
    require(__dirname+"/ws.js")
}