
 



// let a={
//     c:1
// }

// let b={
//     e:3,
//     hh(){
//         console.log(this.c);
//     }
// }
// b.__proto__  = a;
// console.log(b.hh());

const App=require("../src/index");
 
new  App().serviceDir(__dirname+"/service").use(function(ctx){
    console.log("a")
    console.log(this.$service);
}).use(function(ctx){
       
    console.log("b")
    console.log(this.$service);
}).route("/test/(.*?)/(.*?)$", function (ctx) {
   // console.log(this.$service);
   
    ctx.success("hello world"+ JSON.stringify(ctx.params()));    

})
.route("/assets",require(__dirname+"/../../tiny-app-nodejs-assets-handler/src/index.js").callback(__dirname+"/assets"))
.module(__dirname+"/app").listen(8896);