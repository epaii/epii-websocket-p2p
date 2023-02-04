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