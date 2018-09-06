/*worker顺序还是从上往下 再onmessage,jsonp回调函数写在再onmessage里面..还是postMessage快两三倍,
 * 尽管这是复制数据过来 内存貌似大一倍   ,但jsonp加载进来要31ms  postMessage只需9ms*/
console.time("worker-搜索");
//let posData="";
//function funAllCity(data){
//	let arrKeyCity=Object.keys(data);
//	let arrKeyCityLength=arrKeyCity.length;
//	for(let i=0;i<arrKeyCityLength;i++){
//		arrKeyCity[i]=1;	
//	}
//	postMessage("");
//}
onmessage=function(obj){//data:inputVlaue,allCity	
	console.log("worker:"+obj.data.inputValue);
	let inputValue = obj.data.inputValue;
	let arrKeyCity=Object.keys(obj.data.allCity);//把json对象属性名转为数组 不会遍历原型
	let arrKeyCityLength=arrKeyCity.length;
	let re =new RegExp(inputValue,"gim");//匹配输入框的值(相当于 /成都市/gim)  ,包含变量 的正则不能使用字面量正则. 全局 不区分大小写 换行也继续匹配
	let arrResultCity={//存储计算结果 array, 城市名 经纬度
		name:[],
		xy:[]
	}
	for(let i=0;i<arrKeyCityLength;i++){//Array.indexOf是全等匹配 数组 返回索引,match匹配的是包含关系  可模糊匹配		
		if(arrKeyCity[i].match(re)){
			//arrResultCityNameIndex.push(i);//向数组添加匹配到的索引(记录下模糊匹配到的值在arrKeyCity数组中的位置)
			arrResultCity.name.push(arrKeyCity[i]);//直接push结果值	
			arrResultCity.xy.push(obj.data.allCity[arrKeyCity[i]]);//把key对应的value取出(城市对应的x y)
		}
	}
	postMessage(arrResultCity);
	console.log(arrResultCity)
	//importScripts('../allCity.haohao');
	console.timeEnd("worker-搜索");
	close();
}
