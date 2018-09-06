const express = require('express');
let axios = require('axios');
const urlJson = require('url');
let exp = express();
const http = require('http').Server(exp);
let io = require('socket.io')(http);
let address = 'http://192.168.43.112';
//请求出境城市(g=正常,y=延误,r=取消,a=所有)
function getoutFlights(query, state) {
    return axios.get(`${address}:8080/flight/juhe/out/city?${query}&state=${state}`);
};
//请求入境城市(g=正常,y=延误,r=取消,a=所有)
function getinFlights(query, state) {
    return axios.get(`${address}:8080/flight/juhe/out/city?${query}&state=${state}`);
};
//城市 一天的时间(3小时一次) 航班延误 取消 正常分布
//query : 城市名 与某天时间
function getCityhoursInfo(query) {
    return axios.get(`${address}:8080/flight/single/city/info?${query}`);
};
//国内全部出境航班
exp.get('/node/out/city/home', function (req, res) {
   // console.time("国内转发耗时");
    let query = urlJson.parse(req.url, false).query;
  //  console.log(query);
    axios.get(`${address}:8080/flight/juhe/out/city/home?${query}`)
        .then(function (body) {
            if (body.status == 200) {
               // console.timeEnd("国内转发耗时");
              //  console.log('国内全部航班');
                //console.log(body.data);
                res.send(body.data);
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//国际全部出境航班
exp.get('/node/out/city/county', function (req, res) {
   // console.time("国际转发耗时");
    let query = urlJson.parse(req.url, false).query;
   // console.log(query);
    axios.get(`${address}:8080/flight/juhe/out/city/county?${query}`)
        .then(function (body) {
            if (body.status == 200) {
               // console.timeEnd("国际转发耗时");
              //  console.log('国际全部航班');
               // console.log(body.data);
                res.send(body.data)
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
exp.get('/node/single/city/hours', function (req, res) {
   // console.time("axios并发耗时");
    let query = urlJson.parse(req.url, false).query;
    let queryJson = urlJson.parse(req.url, true).query;
   // console.log(queryJson);
   // console.log(query);
    //计算间隔多少天
    let dayNum = parseInt((queryJson.timeEnd - queryJson.timeStart) / 86400);
   // console.log(dayNum + "天")
    let arrFun = [];
    //并发请求  拼接上参数  又是加法坑...
    //循环并发...  加进数组 返回的promise对象
    for (let i = 0; i < dayNum; i++) {
        arrFun.push(getCityhoursInfo(`city=${queryJson.city}&time=${parseInt(queryJson.timeStart) + parseInt(i * 86400)}`));
    }
   // console.log(arrFun);
    axios.all(arrFun)
        .then(axios.spread(function (...results) {
           // console.timeEnd("axios并发耗时");
            let everyDayHours = [];
            for (let i = 0; i < results.length; i++) {
                everyDayHours.push(results[i].data)
            }
           // console.log(everyDayHours);
            res.send(everyDayHours);
            res.end()
        })).catch(function (error) {
            console.log(error);
            res.send([]);
        });
});
//c5 时间轴
//http://localhost:8082/node/all/city?city=New%20York&timeStart=1521043200&timeEnd=1522166400
exp.get('/node/all/city', function (req, res) {
    //console.time("axios合并航班耗时");
    let query = urlJson.parse(req.url, false).query;
   // console.log(query);
    //res.send({"g":[[["北京市",2],["大理白族自治州",1],["广州市",1],["杭州市",1],["昆明市",1],["兰州市",1],["南京市",1],["上海市",2],["天津市",1],["武汉市",1]],[["北京市",2],["大理白族自治州",1],["济南市",1],["昆明市",2],["南京市",1],["山南地区",1],["深圳市",1],["沈阳市",1],["石家庄市",1],["天津市",1],["武汉市",1],["郑州市",1]],[["北京市",1],["海口市",1],["昆明市",1],["南京市",1],["山南地区",1],["乌鲁木齐市",1],["郑州市",1]]],"y":[[["北京市",1],["长沙市",1],["大理白族自治州",2],["海东地区",1],["海口市",1],["南京市",1],["三亚市",1],["山南地区",1],["上海市",1],["深圳市",2],["石家庄市",1],["乌鲁木齐市",1]],[["北京市",1],["长沙市",1],["大理白族自治州",3],["广州市",1],["海口市",2],["杭州市",1],["兰州市",1],["山南地区",2],["上海市",3],["乌鲁木齐市",1]],[["北京市",2],["长沙市",1],["大理白族自治州",3],["广州市",1],["杭州市",1],["济南市",1],["兰州市",2],["南京市",1],["山南地区",1],["上海市",3],["深圳市",1],["太原市",1],["天津市",1]]],"r":[[["北京市",3],["长沙市",1],["大理白族自治州",3],["广州市",1],["海东地区",1],["海口市",1],["杭州市",1],["昆明市",1],["兰州市",1],["南京市",2],["三亚市",1],["山南地区",1],["上海市",3],["深圳市",2],["石家庄市",1],["天津市",1],["乌鲁木齐市",1],["武汉市",1]],[["北京市",3],["长沙市",1],["大理白族自治州",4],["广州市",1],["海口市",2],["杭州市",1],["济南市",1],["昆明市",2],["兰州市",1],["南京市",1],["山南地区",3],["上海市",3],["深圳市",1],["沈阳市",1],["石家庄市",1],["天津市",1],["乌鲁木齐市",1],["武汉市",1],["郑州市",1]],[["北京市",3],["长沙市",1],["大理白族自治州",3],["广州市",1],["海口市",1],["杭州市",1],["济南市",1],["昆明市",1],["兰州市",2],["南京市",2],["山南地区",2],["上海市",3],["深圳市",1],["太原市",1],["天津市",1],["乌鲁木齐市",1],["郑州市",1]]],"a":[[["北京市",3],["长沙市",1],["大理白族自治州",3],["广州市",1],["海东地区",1],["海口市",1],["杭州市",1],["昆明市",1],["兰州市",1],["南京市",2],["三亚市",1],["山南地区",1],["上海市",3],["深圳市",2],["石家庄市",1],["天津市",1],["乌鲁木齐市",1],["武汉市",1]],[["北京市",3],["长沙市",1],["大理白族自治州",4],["广州市",1],["海口市",2],["杭州市",1],["济南市",1],["昆明市",2],["兰州市",1],["南京市",1],["山南地区",3],["上海市",3],["深圳市",1],["沈阳市",1],["石家庄市",1],["天津市",1],["乌鲁木齐市",1],["武汉市",1],["郑州市",1]],[["北京市",3],["长沙市",1],["大理白族自治州",3],["广州市",1],["海口市",1],["杭州市",1],["济南市",1],["昆明市",1],["兰州市",2],["南京市",2],["山南地区",2],["上海市",3],["深圳市",1],["太原市",1],["天津市",1],["乌鲁木齐市",1],["郑州市",1]]]});
    //res.end();
    //并发请求
    axios.all([getoutFlights(query, 'g'), getoutFlights(query, 'y'), getoutFlights(query, 'r'), getoutFlights(query, 'a')])
        .then(axios.spread(function (g, y, r, a) {
           // console.timeEnd("axios合并航班耗时");
           // console.log(g.data, y.data, r.data);
            res.send({ g: g.data, y: y.data, r: r.data, a: a.data });
            res.end();
        })).catch(function (error) {
            console.log(error);
        });
});
//出港城市名与数量(前端query:city&timeStart&timeEnd&state=r|g|y|a)
exp.get('/node/out/city', function (req, res) {
   // console.time("转发耗时");
    let query = urlJson.parse(req.url, false).query;
   // console.log(query);
    axios.get(`${address}:8080/flight/juhe/out/city?${query}`)
        .then(function (body) {
            if (body.status == 200) {
               // console.timeEnd("转发耗时");
               // console.log('出港后到达城市名与数量');
               // console.log(body.data);
                res.send(body.data)
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//航班号与其信息  list(参数两个城市与时间)

exp.get('/node/list', function (req, res) {
   // console.time("航班list");
    let query = urlJson.parse(req.url, false).query;
   // console.log(query);
    axios.get(`${address}:8080/flight/single/list/from_to?${query}`)
        .then(function (body) {
            if (body.status == 200) {
              //  console.timeEnd("航班list");
               // console.log('出港后到达城市名与数量');
               // console.log(body.data);
                res.send(body.data)
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//入港城市  全部 //
exp.get('/node/in/city', function (req, res) {
   // console.time("转发耗时");
    let query = urlJson.parse(req.url, false).query;
  //  console.log(query);
    axios.get(`${address}:8080/flight/juhe/in/city?${query}`)
        .then(function (body) {
            if (body.status == 200) {
               // console.timeEnd("转发耗时");
             //   console.log('出港后到达城市名与数量');
              //  console.log(body.data);
                res.send(body.data)
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//入港城市  国内
exp.get('/node/in/city/home', function (req, res) {
   // console.time("转发耗时");
    let query = urlJson.parse(req.url, false).query;
   // console.log(query);
    axios.get(`${address}:8080/flight/juhe/in/city/home?${query}`)
        .then(function (body) {
            if (body.status == 200) {
             //   console.timeEnd("转发耗时");
             //   console.log('出港后到达城市名与数量');
              //  console.log(body.data);
                res.send(body.data)
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
exp.get('/node/in/city/county', function (req, res) {
   // console.time("转发耗时");
    let query = urlJson.parse(req.url, false).query;
   // console.log(query);
    axios.get(`${address}:8080/flight/juhe/in/city/county?${query}`)
        .then(function (body) {
            if (body.status == 200) {
               // console.timeEnd("转发耗时");
               // console.log('出港后到达城市名与数量');
             //   console.log(body.data);
                res.send(body.data)
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//航空公司运营规模 延误数 准点率 延迟时间 (秒) 
exp.get('/node/out/zhundian', function (req, res) {
   // console.time("转发耗时");
    let query = urlJson.parse(req.url, false).query;
  //  console.log(query);
    axios.get(`${address}:8080/flight/juhe/out/zhundian?${query}`)
        .then(function (body) {
            if (body.status == 200) {
               // console.log('航空公司信息:');
              //  console.log(body.data);
                res.send(body.data);
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//出入港 城市所在国家名字与数量
exp.get('/node/all/countyName', function (req, res) {
   // console.time("国家耗时");
    let query = urlJson.parse(req.url, false).query;
    axios.get(`${address}:8080/flight/juhe/out/countyName?${query}`)
        .then(function (body) {
            if (body.status == 200) {
              //  console.timeEnd("国家耗时");
              //  console.log('出入港城市所在国家名字与数量');
              //  console.log(body.data);
                res.send(body.data);
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//耗油
exp.get('/node/juhe/city/oli', function (req, res) {
    let query = urlJson.parse(req.url, false).query;
   // console.time('耗油耗时');

    axios.get(`${address}:8080/flight/juhe/city/oli?${query}`, { responseType: 'text' })
        .then(function (body) {
            if (body.status == 200) {
              //  console.timeEnd('耗油耗时');
              //  console.log('时间范围内耗油量 (美制加仑):');
               // console.log(body.data);
                res.send(body.data);
                res.end();
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//航班号模糊搜索 收到ident + 来往城市
exp.get('/node/indent', function (req, res) {
    let query = urlJson.parse(req.url, false).query;    
    axios.get(`${address}:8080/flight/searchIdent?${query}`)
        .then(function (body) {
            if (body.status == 200) {
             //   console.log(body.data);
                res.send(body.data);
            } else {
                
            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//根据航班号与时间  查询某次航班最详细的信息
exp.get('/node/indent/info', function (req, res) {
    let query = urlJson.parse(req.url, false).query;
   // console.log('单个航班详细信息参数');
   // console.log(query);
    axios.get(`${address}:8080/flight/single/info/ident?${query}`)
        .then(function (body) {
            if (body.status == 200) {
               // console.log(body.data);
                res.send(body.data);
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
//两个国家之间的航线
exp.get('/node/twoCountry', function (req, res) {
    let query = urlJson.parse(req.url, false).query;
   // console.log('两国参数');
   // console.log(query);
    //调试的数据
    // res.send({"重庆市":["Los Angeles","New York","Vilas"],"上海市":["Shelby","Honolulu","King","Tarrant","Anchorage","Chicago","Austin","Boston","San Jose","New York","Wayne","Los Angeles","Oakland","San Mateo","Newark"],"深圳市":["Los Angeles","Anchorage","King"],"福州市":["New York"],"桃园市":["San Mateo","Anchorage","Chicago","Los Angeles","King","Honolulu","Houston","San Bernardino","New York"],"厦门市":["Honolulu","San Mateo","Los Angeles"],"澳门特别行政区":["Anchorage"],"北京市":["Los Angeles","Loudoun","Boston","King","San Jose","Chicago","Oakland","Vilas","Honolulu","Anchorage","Wayne","Tarrant","Newark","Paradise","New York","Houston","San Mateo"],"广州市":["San Mateo","Los Angeles","New York","Anchorage"],"香港特别行政区":["Newark","Honolulu","Boston","King","New York","Los Angeles","Allegheny","Boone","Chicago","Seattle","Hawai'i","Shelby","Tarrant","San Mateo","Anchorage"],"南京市":["Los Angeles","Anchorage"],"长沙市":["Los Angeles"],"成都市":["New York","Anchorage","San Mateo","Los Angeles"],"咸阳市":["Vilas"],"青岛市":["San Mateo","Los Angeles"],"济南市":["Los Angeles"],"郑州市":["Anchorage"],"杭州市":["Los Angeles","Anchorage"],"武汉市":["San Mateo","Anchorage"]});
    axios.get(`${address}:8080/flight/twoCounty?${query}`)
        .then(function (body) {
            if (body.status == 200) {
              //  console.log(body.data);
                res.send(body.data);
            } else {

            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
exp.get('/node/optionMapCityInfo', function (req, res) {
    let query = urlJson.parse(req.url, false).query;
    //console.log('机场名');
   // console.log(query);
    axios.get(`${address}:8080/flight/optionMapCityInfo?${query}`)
    .then(function (body) {
        if (body.status == 200) {
           // console.log(body.data);
            res.send(body.data);
        } else {

        }
    })
    .catch(function (error) {
        console.log(error);
    });
});
exp.get('/node/weather', function (req, res) {
    // res.send({"1517587200":{"day":["小雨","8","无明显风向","<3级"],"night":["小雨","1","无明显风向","<3级"]},"1517673600":{"day":["小雨","4","无明显风向","<3级"],"night":["雨夹雪","-1","无明显风向","<3级"]},"1517760000":{"day":["多云","8","无明显风向","<3级"],"night":["多云","2","无明显风向","<3级"]}});
    let query = urlJson.parse(req.url, false).query;
    //console.log('机场名');
   // console.log(query);
    axios.get(`${address}:8080/flight/getWeather?${query}`)
    .then(function (body) {
        if (body.status == 200) {
            res.send(body.data);
        } else {
            console.log(body);
        }
    })
    .catch(function (error) {
        console.log(error);
    });
});
//socket.io 通讯
(function(){
    let onlineNum = 0;
    let history=[];
    io.on('connection', function (socket){//connection 连接,socket参数 :一个socket相当于客户端连接
        console.log('用户已连接');
        onlineNum++;
        //连接和断开主动向前端发送
        io.emit('onlineNum',onlineNum);
        //连接时 发送聊天记录
      let  strhistory=JSON.stringify(history);
        io.emit('history',strhistory);
        socket.on('disconnect', function(){//连接断开事件
           console.log('断开了');
            onlineNum--;
            io.emit('onlineNum',onlineNum);
        });
        socket.on('chat', function(msg,callback){//服务端的on chat事件  第二个参数 服务端接收到消息前端的回调
            msg.chatText = (msg.chatText).substr(0,340);
            
           // console.log((msg.chatText).length);//字数 限制250个
           if(msg.self&&msg.chatText){
               //不要二次JSON.stringify
                if(history.length<100){         
                    history.push(msg);
                }else{
                    history.shift();
                    history.push(msg);
                }
                let text = JSON.stringify(msg);
                console.log('历史记录:'+history.length);
                console.log('收到: ' + text );
                io.emit('chat',text);//将收到的msg发给所有人,服务端emit 对应客户端socket.on('chat',)
                callback('send_ok');//收到消息后 回传给客户端的回调
           }
        });
    });
})();
//let url = 'http://172.17.6.99:8080/flight/juhe/out/city/home?city=%E5%8C%97%E4%BA%AC%E5%B8%82&timeStart=1517587200&timeEnd=1517846400&state=a'
//})();//闭包结束
// for(let i=0;i<100;i++){
//     axios.get(`url+${i}`)
//     .then(function (body) {
//         if (body.status == 200) {
//             console.log(body.data);
//             res.send(body.data)
//         } else {

//         }
//     })
//     .catch(function (error) {
//         console.log(error);
//     });
// }
http.listen(8090, function () {
   
});
//exp.listen(8090);