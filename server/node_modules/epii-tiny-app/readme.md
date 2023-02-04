# `epii-tiny-app`   使用教程


# 简单但够用的nodejs web服务框架

### 安装方式
`npm i epii-tiny-app -s`

## 一 基础使用

最简单的使用方式

```javascript
const App=require("epii-tiny-app");

new  App().route("/",function(ctx){
    ctx.success("hello world");
}).listen(8896);

```
当访问 *http://127.0.0.1:8896/* 返回
```json
{"code":1,"msg":"成功","data":"hello world"}
```

你也可以这样

```javascript
new  App().route("/",function(ctx){
    ctx.success("hello world");
}).route("/api1",function(ctx){
    ctx.success({name:"lilei",age:10});
}).route("/api2",function(){
    return {name:"lilei",age:10};
}).listen(8896);
```

当访问*http://127.0.0.1:8896/api1*  或 *http://127.0.0.1:8896/api2* 均返回

```json
{"code":1,"msg":"成功","data":{"name":"lilei","age":10}}
```

`ctx` 为上下文对象 其结构主要为

```javascript
{
    req: request,
    res: response,
    params(key, dvalue) {
    },
    success(data) {
    },
    error(msg = "error", code = 0, data = {}) {
    },
    content(htmlString){
    }

}
```

其中`req`和`res`分别为 `nodejs`的 `request` `response` ,你可以用它做你的逻辑，但一一般不建议使用，除非在处理header 等特殊要求时候才使用。

`ctx.params()` 方法为获取post和get参数 如
```JavaScript
let age =  ctx.params("age",10);//默认值为10
let allData = ctx.params() ;// 返回所有参数
```

### `ctx.success` 和 `ctx.error` 是两个api接口化的输出，`ctx.content` 是传统html的输出


### `app.listen()` 方法只是以下方法的语法糖:
```js
const http = require('http');
const app = new App();
http.createServer(app.callback()).listen(8896);
```

这意味着您可以将同一个应用程序同时作为 HTTP 和 HTTPS 或多个地址：

```js
const http = require('http');
const https = require('https');
const App=require("epii-tiny-app");
const app = new App();
http.createServer(app.callback()).listen(8896);
https.createServer(app.callback()).listen(8897);
```

### `app.callback()`

返回适用于 http.createServer() 方法的回调函数来处理请求。你也可以使用此回调函数将 App 应用程序挂载到 Connect/Express 应用程序中。

## 二 模块的使用
> 一个系统，我们一般分为多个模块，比如管理后台，用户中心，通过 `route`模式每一个api都需要设置，对于综合系统比较繁琐，而模块化正是解决类似的问题。

例如，用户模块我们成为user，首先创建 user目录，然后在user目录下创建任意文件，如info.js 内容如下

```js
module.exports={
    getInfoById(ctx){
        return {name:"zhangsan",age:10};//也可以直接 ctx.success()
    },
    func1(ctx){
        
        ctx.success({ok:1})
    },
    func1(ctx){
        ctx.error("error")
    }
}
```

然后在入口文件改为

```js
new  App().route("/",function(ctx){
    ctx.success("hello world");
}).module("/user",__dirname+"/user").listen(8896);
```
当访问*http://127.0.0.1:8896/user?app=info@getInfoById* 就会返回

```json
{"code":1,"msg":"成功","data":{"name":"zhangsan","age":10}}
```

`app.module(name, baseDir)` 的方法，第一个参数，设置模块名称，第二个设置此模块的的路径，
之后可以通过
*http://127.0.0.1:8896/moduleName?app=filename@funname*的方式来访问。

> 一个系统可以有多个模块，每一个模块可以有多个文件，每一个文件可以有多个具体方法，一切就这么简单。

## 三 初始化

一个系统在启动前，需要很多初始化任务，并且大部分是在任务初始化完成后才能启动web服务。实现方式如下

```js
new App().init((app) => {
    //do some work
}).init( async (app) => {
    await doSomeWork();
}).init(function (app) {
    return new Promise(ok => {
        setTimeout(() => {
            //do some work
            ok();
        }, 3000);
    })
}).route("/", function (ctx) {
    ctx.success("hello world");
}).module("/user", __dirname + "/user").listen(8896);
```

`app.init`的方法可实现初始化任务，如果是prmise则等待任务执行完毕后才启动。每一个任务仅执行一次。

## 四 公共方法（服务）
如果有一些对象或者方法，需要在多处使用比如 `init中 route中或者 在module` 的具体方法中. 我们可以通过 `app.service(name,obj)`的方法 绑定到 `init route  module的具体方法` 的 `this.$service.{name}`来使用，省去 `require`的麻烦

如 
```js
new App().service("mathAdd",function(a,b){
    return a+b;
}).init((app) => {
   console.log("1+2="+this.$service.mathAdd(1,2))
}).route("/", function (ctx) {
    ctx.success({result:this.$service.mathAdd(1,2)});
}).module("/user", __dirname + "/user").listen(8896);

```

也可以在module的具体方法中，如info.js中
```js
module.exports={
    getInfoById(ctx){
        return {result:result:this.$service.mathAdd(1,2)};//也可以直接 ctx.success()
    }
}
```


> app的所有方法都支持链式写法，service方法可以 通过 `app.service("service1",obj).service("service2",obj)` 来实现多个服务



### 通过设置服务目录，批量自动加载服务 `app.serviceDir` 

如 
```js
new App().serviceDir(__dirname+"/service").module("/user", __dirname + "/user").listen(8896);
```

设置 `app.serviceDir(__dirname+"/service")` 后，只要在此目录下的文件会自动挂在到 `this.$service` 下.

如在 `service/user.js`

```js
module.exports={
    info(uid){
        return {name:"zhangsan"};//也可以直接 ctx.success()
    }
}
```

在 `init route  module的具体方法中`可以通过此中方式直接访问

```js
    this.$service.user.info(1)
```
> 多级目录 如 `service/test/tool.js` 可以通过  `this.$servic.test.tool` 来访问


## 五 中间件 

可通过 `app.use()` 来加载中间件，中间件可以在每次web请求时做相应的业务处理。

如
```js
new App().use(function(ctx){
     console.log(" log1 ");
     ctx.shareData.key1 = "value1"
}).use( async function(ctx){
    //this.$service 中间件也可以使用this.$server
     await doSomeThing();
     console.log(" log2 "+ctx.shareData.key1);
}).route("/", function (ctx) {
    ctx.success(ctx.shareData.key1);
}).module("/user", __dirname + "/user").listen(8896);

```

在每一次请求时，都会先一次执行每一个中间件，然后再进入具体处理逻辑。

> 在中间件函数中也可以使用 `this.$service` 

>  可以通过`ctx.success(),ctx.error(),ctx.html()` 提前结束web请求，后面的中间件和相应的处理函数均不在执行。

### 中间件可通过`ctx.shareData` 来实现数据共享，每一个请求都会产生一个ctx,无论是在中间件中，还是在具体处理函数中，都可以通过`ctx.shareData` 来实现共享








