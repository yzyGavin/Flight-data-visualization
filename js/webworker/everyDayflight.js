importScripts('../request.js');
onmessage = function(e) { //链接和参数都为主线程e.data对象
	console.log(e.data.headerType);
	console.log(e.data.arg);
	request('get', e.data.headerType, e.data.arg, function(data) {
		//console.log(data);
		if(e.data.headerType == '/node/out/city' || e.data.headerType == '/node/in/city') { //区分是否为多天的				
			let arrData = JSON.parse(data); //多天的 每天里有详细城市名与航班数的二维数组
			let arrData_all = []; //多天数组合并,未去重
			for(let i = 0; i < arrData.length; i++) {
				arrData_all.push(...arrData[i]);
			}
			//console.log(arrData);
			//console.log(arrData_all);
			//console.log(arrData.length+"天");
			let setDataCityName = new Set(); //去重了的 城市名  , Set集合(利用Set集合特性合并 并且去重)
			for(let i = 0; i < arrData.length; i++) { //循环 -每天
				for(let cityNum = 0; cityNum < arrData[i].length; cityNum++) { //循环 - 每天中的城市数量
					setDataCityName.add(arrData[i][cityNum][0]); //把所有城市名添加到Set
					//console.log(arrData[i][cityNum]); 
				}
				console.log(arrData[i].length);
			}
			let arraDataCityName = [...setDataCityName]; //利用展开运算符 把set转数组
			let arraDataCityValue = []; //存放去重后各个城市对应的 vlaue累加
			let sum;
			console.log("去重后的城市:" + arraDataCityName.length);
			for(let disCity = 0; disCity < arraDataCityName.length; disCity++) { //去重后的数组索引disCity					
				sum = 0;
				//当前循环arraDataCityName不变 , arrData[i][cityNum][0]一直变化 并与arraDataCityName对比,相同就累加 直到cityNum==arrData[i].length-1 向数组push 这次累加的值(对应当前相等城市)					
				//console.log(arraDataCityName[disCity]);
				//let n=0; 
				for(let cityNum = 0; cityNum < arrData_all.length; cityNum++) { //循环 - 每天中的城市数量
					if(arrData_all[cityNum][0] == arraDataCityName[disCity]) {
						//console.log(arraDataCityName[disCity]);
						//console.log(arrData[i][cityNum][0]);
						sum += arrData_all[cityNum][1];
						//arraDataCityValue.push([sum]);
						//arraDataCityValue.push(sum);
						//if(cityNum==arrData_all.length-1){
						//	n++;
						//sum+=arrData_all[cityNum][1];
						//console.log(arrData[i].length)
						//console.log(n+"次");

						//}

					}
				}
				//console.log(sum);
				arraDataCityValue.push(sum);
			}
			//console.log(arraDataCityName);
			//console.log(arraDataCityValue);
			let city = {
				name: arraDataCityName,
				value: arraDataCityValue,
				word: []
			}
			for(let i = 0; i < arraDataCityName.length; i++) {
				city.word.push({
					name: arraDataCityName[i],
					value: arraDataCityValue[i]
				});
			}
			postMessage(city);
			close();
		} else {
			let city = {
				name: [],
				value: [],
				word: []
			}
			let arrData = JSON.parse(data);
			for(let i = 0; i < arrData.length; i++) {
				city.name.push(arrData[i][0]);
				city.value.push(arrData[i][1]);
				city.word.push({
					name: arrData[i][0],
					value: arrData[i][1]
				});
			}
			console.log(arrData);
			postMessage(city);
			close();
		}

		
	});

}