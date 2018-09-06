//用定时器 分段发送  减缓主线程绘图压力  效果不理想  已经取消   echarts官方文档
//appendData用法不明确 就翻了很久源码 加上解决了3000数据bug  现在可以用了
importScripts('../request.js');
function funAllCityNum(cityNum){//先加载城市航班数量数据   	
onmessage=function(city){//接收主线程城市名与经纬度
	console.time("worker散点图");
	let arrKeyCity=Object.keys(city.data);//4ms //city城市名 数组. 不会遍历原型上的属性名  性能比for in几乎快一倍
	let arrKeyCitylength = arrKeyCity.length;
	let arrScatter=[];//散点图 城市名  经纬度数据
	for(let i=0;i<arrKeyCitylength;i++){
		arrScatter.push({name:arrKeyCity[i],value:city.data[arrKeyCity[i]].concat(Math.round(cityNum[arrKeyCity[i]]/3))});
	}
	postMessage(arrScatter);
	close();
	console.timeEnd("worker散点图");
}}
importScripts('../allCityFlightNum.js');