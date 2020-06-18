```
  <script src="../dist/epii-websocket-p2p.js"></script>
    <script>
        var test_server = new WebSocketP2P("ws://127.0.0.1:4897", "user_1", {
            name: "张三"
        });
        test_server.ready(function () {
            test_server.regServer("server1", function (data, callback) {
                setTimeout(() => {
                    callback({"code":Math.random()})
                }, 2000);
                  
            })

            test_server.regServer("fangshenfenzheng", function (data, callback) {
                alert("请放身份证")
               
                callback({"idcard":Math.random()})
              
                  
            })

        });

         test_server.callServer("user_1", "server1", {
                a: 1,
                vd: 2
            }, function (ret) {
                console.log(ret)
            });

    </script>
```