//启用严格模式
"use strict";
//封装系统工具			
let doc = document;
let sys = { //简化取dom
	getel: function(o) {
		return doc.querySelectorAll(o);
	},
	vm: function(obj, attr, fun, boolean) { //数据观察者 (对象 属性 回调 可重写)
		if(boolean == undefined) {
			boolean = true;
		}
		let old = obj[attr];
		Object.defineProperty(obj, attr, {
			set: function(data) {
				let bool = false;
				if(data == old) {
					fun(data, bool); //fun:重新赋值的回调  参数: data:监听的值(可能变化),bool :是否变化 
					console.log("重新赋值了,但未发生变化");
				} else {
					bool = true; //变化 了 回调标识参数改为true 
					fun(data, bool);
				}
			}, //是否可重写  默认是
			configurable: boolean
		});
	},
	//简写样式 元素 样式 、是否清空
	setStyle: function(el, strCss, boolean) {
		let oEl = doc.querySelectorAll(el);
		let length = oEl.length;
		for(let i = 0; i < length; i++) {
			if(typeof arguments[2] == "undefined" || arguments[2] == false) {
				oEl[i].style.cssText += strCss;
			} else {
				oEl[i].style.cssText = strCss;
			};
		};
	}, //数据交互  允许get缓存  bool 默认open参数为true 异步(浏览器已限制同步请求)
	request: function(type, url, senddata, success, err) {
		if(window.XMLHttpRequest) {
			var oAjax = new XMLHttpRequest();
		} else {
			var oAjax = new ActiveXObject("Microsoft.XMLHTTP");
		}
		if(arguments[0] == 'get') {
			url += '?' + senddata;
			oAjax.open(type, url, true);
			oAjax.send();
		} else if(arguments[0] == 'post') {
			oAjax.open(type, url, true);
			oAjax.setRequestHeader('Cache-Control', 'max-age=3053600');
			oAjax.send(senddata);
		}
		oAjax.onreadystatechange = function() {
			if(oAjax.readyState == 4) {
				if(oAjax.status == 200) {
					success(oAjax.responseText);
				} else {
					err(oAjax.status);
					console.log('失败了:' + oAjax.status);
				}
			}
		}
	}
};
//			sys.getel("#checkbox_lines")[0].onclick = function() {
//				if(!this.checked) {
//
//				}
//			}
//本地存储
sys.mySave = {
	save: function(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
	},
	getsave: function(key) {
		return JSON.parse(localStorage.getItem(key)) || []; // 第一个正确后面就会被忽略 (如果没有值,返回空字符串)
	}
}
//indexDB: localForage再封装
let indexDB = {
	set: function(key, value, success, funErr) {
		localforage.setItem(key, value, function(err, value) {
			if(err) {
				console.log("存储出现错误:" + err);
				console.dir(err);
				if(funErr) {
					funErr(err);
				} else {
					//不执行
				}
			} else {
				//console.log("存储成功" + value);
				success(value);
			}
		});
	},
	get: function(key, success, errNull) {
		localforage.getItem(key, function(err, value) {
			if(err) {
				console.log("取值出现错误:" + err);
			} else {
				if(value) {
					//console.log('取值成功');
					success(value);
				} else {
					if(errNull) {
						errNull(value);
					} else {
						//errNull回调未缺省才执行
					}
					console.log('取值:value为空或错误')
				}
			}
		});
	}
};
//兼容性检测函数:if(window.Worker)			
//web Worker
sys.worker = function(src, sendData, callBack) {
	let webWorker = new Worker(`./js/webworker/${src}`);
	webWorker.postMessage(sendData);
	webWorker.onmessage = function(e) {
		callBack(e);
	};
	webWorker.onerror = function(error) {
		console.log("Worker地址" + src + "错误:" + error.message, error.filename, error.lineno);
	}
};
//全局request请求的参数对象
let requestArg = {
	cityName: "成都市"
};
//系统设置,默认值
let setUp = {

};
if(sys.mySave.getsave('setUp') == '') {
	setUp = {
		linesAnimation: true,
		oliAnimation: true,
		linesHightColor: '#00F5FF', //h5 color只支持十六进制
		saveImageType: 'png',
		timeLineDelay: 2000,
		countryTop: 10,
	}
	sys.mySave.save('setUp', setUp);
} else {
	setUp = sys.mySave.getsave('setUp');
	//console.log(sys.mySave.getsave('setUp'))
};
//便签保存
let Memo = {
	timer: null,
	dom: sys.getel("#side_text")[0],
	subDom: sys.getel("#side_title_sub")[0],
	i: 0
}
Memo.dom.value = sys.mySave.getsave('MemoText');
Memo.dom.addEventListener('input', function() {
	clearTimeout(Memo.timer);
	Memo.timer = setTimeout(function() {
		sys.mySave.save('MemoText', Memo.dom.value);
		Memo.i++;
		Memo.subDom.innerText = '已为您自动保存' + Memo.i + '次';
		console.log('保存成功');
	}, 1500);
});

//初始化图表
let optionMap = echarts.init(sys.getel("#optionMap")[0]); //配置页地图 初始化
let charts = sys.getel("[chart]");
let map = echarts.init(charts[3]);
let c1 = echarts.init(charts[0]);
let c2 = echarts.init(charts[1]);
let c3 = echarts.init(charts[2]);
let c5 = echarts.init(charts[4]);
//let c6 = echarts.init(charts[5]);
let c7 = echarts.init(charts[5]);
//			let c8 = echarts.init(charts[6]);
let c9 = echarts.init(charts[7]);

let secondXy = echarts.init(sys.getel("#secondPageMapXy")[0]);
let aHighlightEd = []; //记录已经高亮的params.dataIndex
sys.clearHightLines = function() {
	for(let i = 0; i < aHighlightEd.length; i++) {
		map.dispatchAction({ //  把所有高亮的清除
			type: 'downplay',
			seriesIndex:  [0, 1],
			dataIndex: aHighlightEd[i]
		});
	};
	for(let i2 = 0; i2 < aHighlightEd.length; i2++) {
		map.dispatchAction({ //再高亮
			type: 'highlight',
			seriesIndex:   [0, 1],
			dataIndex: aHighlightEd[i2]
		});
	}
}
//tool对象 : 侧边栏  全屏  右键菜单 搜索功能
let tool = {

}
//提示窗 构造函数
tool.FunPopup = function(title, body) {
	this.oPopup = sys.getel("#popup_border")[0];
	this.oTitle = this.oPopup.querySelector("#popup_title");
	this.oBodySpan = this.oPopup.querySelector("#popup_body span");
	this.oBody = this.oPopup.querySelector("#popup_body");
	this.oMask = sys.getel("#popup_mask")[0];
	this.oBtnTrue = this.oPopup.querySelector("#popup_true");
	this.oBtnFalse = this.oPopup.querySelector("#popup_false");
	this.oTitle.innerHTML = title;
	this.oBodySpan.innerHTML = body;
	this.state;
}
//添加方法到原型上
//关闭弹出窗
tool.FunPopup.prototype.close = function(fun) {
	this.oMask.style.zIndex = "-1";
	this.oPopup.style.transform = "perspective(600px) scale(0)";
	this.oPopup.style.opacity = "0";
	this.oBody.className = '';
}
//打开弹出窗、按钮操作与true后的回调
tool.FunPopup.prototype.open = function(fun) {
	//改变this指向
	let _this = this;
	this.oMask.style.zIndex = "999";
	this.oPopup.style.transform = "perspective(600px) scale(1)";
	this.oPopup.style.opacity = "1";
	this.oBody.className = 'popup_body_type';
	this.oPopup.style.boxShadow = "0px 0px 0px 100vw rgba(0,0,0,0.7)";

	this.oBtnTrue.onclick = function() {
		_this.state = true;
		_this.oPopup.style.boxShadow = "none";
		_this.close();
		fun();
	};
	this.oBtnFalse.onclick = function() {
		_this.state = false;
		_this.oPopup.style.boxShadow = "none";
		_this.close();
	}
};
//侧边栏
tool.sideBar = function() {
	let btn = sys.getel(".fa-list-ul")[0];
	let oSideBar = sys.getel("#sideBar")[0];
	let box = sys.getel("#box")[0];
	let btn_old_class = btn.className;
	//根据按钮样式 设置侧边栏动画 
	btn.onclick = function(event) {
		event.stopPropagation();
		if(sys.getel(".active-list-ui")[0]) {
			btn.className = btn_old_class;
			box.style.transform = "translate3d(0px,0px,0px)";
			oSideBar.style.transform = "perspective(600px) rotateY(90deg)";
		} else {
			btn.className = btn_old_class + " active-list-ui";
			oSideBar.style.transform = "rotateY(0deg)";
			box.style.transform = "translate3d(-3.5rem,0px,0px)";
		};
	};
};
//全屏操作
tool.fullScreen = function(id) {
	const btn = sys.getel(id)[0];
	let oldClass = btn.className;
	let newClass = "fa fa-compress";

	//监听全屏状态	
	function fullscreenChange() {
		//兼容 - 各浏览器全屏事件名
		let eventChangName = ["fullscreenchange", "msfullscreenchange", "webkitfullscreenchange", "mozfullscreenchange"];
		eventChangName.forEach(function(item, index) {
			if(item) {
				doc.addEventListener(item, function() {
					//兼容 - 各浏览器全屏状态检测
					let bool = true;
					let fullscreenState = [doc.fullscreenElement, doc.mozFullScreen, doc.msFullscreenElement, doc.webkitIsFullScreen];
					fullscreenState.forEach(function(Item, Index) { //多重检测 浏览器是否支持、是否全屏，并改变安按钮状态
						if(Item) {
							btn.className = newClass;

						} else if(Item == false) {
							btn.className = oldClass;

							charts[2].style.height = '2rem';
							charts[4].style.height = '2rem';
							c3.resize();
							c5.resize();
						} else if(Item == undefined) {
							//console.log("您的浏览器不支持全屏状态检测：");
						}
					});
				}, false);
			}

		});
	};

	function fun_full() {
		if(btn.className == oldClass) { //进入全屏
			const docElm = doc.documentElement;
			if(docElm.requestFullscreen) {
				docElm.requestFullscreen();
			} else if(docElm.msRequestFullscreen) {
				docElm.msRequestFullscreen();
			} else if(docElm.mozRequestFullScreen) {
				docElm.mozRequestFullScreen();
			} else if(docElm.webkitRequestFullScreen) {
				docElm.webkitRequestFullScreen();
			}

			charts[2].style.height = '3.25rem';
			charts[4].style.height = '3.25rem';
			c3.resize();
			c5.resize();
		} else { //退出全屏
			if(doc.exitFullscreen) {
				doc.exitFullscreen();
			} else if(doc.msExitFullscreen) {
				document.msExitFullscreen();
			} else if(doc.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if(doc.webkitCancelFullScreen) {
				doc.webkitCancelFullScreen();
			}
		};
		fullscreenChange(); //每次点击事件都监听全屏状态,作出相应修改

	};
	//					function c3_c5Style(){
	//						if(btn.className == oldClass){
	//							fun_full();
	//						
	//						}
	//						else{//可能为了安全 浏览器退出全屏的f11按键是没有触发事件的  我们需要自己检测全屏状态,所以这段代码无效,退出全屏的c3c5样式已写在监听全屏状态中
	//						
	//						}
	//				   }
	btn.addEventListener("click", fun_full, false); //btn点击事件触发全屏/退出全屏
	//浏览器出于安全考虑  js无法监听系统内部全屏状态,所以拦截系统事件 重写f11
	//屏蔽f11键 并且调用自己实现的全屏函数
	doc.onkeydown = function(e) {
		let eVent = e || event;
		if(eVent.keyCode == 122) {
			eVent.preventDefault();
			fun_full();
		} else if(btn.className == oldClass && eVent.keyCode != 27 && eVent.keyCode != 122) {
			fun_full();
		}
	}
	doc.addEventListener('click', function(e) {
		if(btn.className == oldClass) {
			fun_full();
		}
	});
	//				doc.addEventListener('contextmenu',function(){
	//					if(btn.className == oldClass){						
	//						fun_full();						
	//					}										
	//				});
};

//鼠标右键菜单 和doc单击隐藏事件
tool.menu = function() {
	//c9 info框 的弹出和隐藏日历的按钮
	let btnLanguage = sys.getel("[tool=language]")[0];
	btnLanguage.addEventListener('click', function() {
		layui.use('layer', function() {
			var layer = layui.layer;
			layer.open({
				area: ['9rem', '5rem'],
				type: 2,
				shade: 0,
				content: ['http://fanyi.baidu.com', 'no']
			});
		});
	});
	//	let btnRili = sys.getel(".fa-arrow-circle-o-left")[0];
	//	//let info = sys.getel("[chart=info]")[0];
	//	btnRili.addEventListener('click', function() {
	//		//c9.resize();
	//		if(this.style.transform == "rotate(180deg)") {
	//			//c9.getDom().style.left = '15.5rem';
	//			this.style.transform = 'rotate(0deg)';
	//			this.title = '弹出日历';
	//			//info.style.opacity = "1";
	//		} else {
	//			this.style.transform = 'rotate(180deg)';
	//			this.title = '隐藏日历';
	//			//c9.getDom().style.left = '10.6rem';
	//			//info.style.opacity = "0";
	//		}
	//
	//	});
	let oMenu = sys.getel("#menu")[0];
	let oMenuChild = oMenu.querySelectorAll("[menu]");
	let oMenuChildLength = oMenuChild.length;
	//先计算实际宽高
	let oMenuComputedWidth = parseInt(getComputedStyle(oMenu).width);
	let oMenuComputedHeight = parseInt(getComputedStyle(oMenu).height);
	let echartFullscreenState = false; //图表全屏状态标识
	//菜单呼出 通过事件委托  提高性能										
	doc.oncontextmenu = function(e) {
		let eVent = e || event;
		//样式先加到前面 否者获取不到display为none且高度自适应的元素的实际高度
		oMenu.style.cssText += 'display:block';
		if(!echartFullscreenState) { //如果图表没全屏(初始化菜单、 全屏后 移出全屏菜单)
			for(let i = 0; i < oMenuChildLength; i++) {
				oMenuChild[i].style.display = "block";
			}
		}
		//依据冒泡到内层的对象属性名与值进行判断 这个对象是谁(由于echarts可能操作了dom,)
		let oAttrValue = eVent.target.parentNode.parentNode.getAttribute("chart");
		let oAttrNode = eVent.target.parentNode.parentNode; //存储触发当前事件对象的父节点的父节点

		switch(oAttrValue) { //分析具体是哪个对象触发的事件
			case "1":
				console.log("冒泡到1");
				break;
			case "2":
				console.log("冒泡到2")
				break;
			case "3":
				console.log("冒泡到3")
				break;
			case "4":
				console.log("冒泡到4")
				break;
			case "5":
				console.log("冒泡到5")
				break;
			case "6":
				console.log("冒泡到6")
				break;
			case "7":
				console.log("冒泡到7")
				break;
			case "8":
				console.log("冒泡到8")
				break;
			case "9":
				
				if(c9.getOption().series[0].name=='shuiqiu'){
					sys.getel("[menu=fullChart]")[0].style.display = "none";
				}else{
					sys.getel("[menu=fullChart]")[0].style.display = "block";
				}
				console.log("冒泡到9")
				break;
			case "info":
				console.log("冒泡到10")
				break;
			default:
				sys.getel("[menu=fullChart]")[0].style.display = "none";
				break;
		}
		//菜单超出边界处理
		//console.log(eVent.clientY);
		//console.log(oMenuComputedHeight);
		//再次检测自身实际宽高
		oMenuComputedWidth = parseInt(getComputedStyle(oMenu).width);
		oMenuComputedHeight = parseInt(getComputedStyle(oMenu).height);
		let x = eVent.clientX > innerWidth - oMenuComputedWidth ? eVent.clientX - oMenuComputedWidth : eVent.clientX;
		let y = eVent.clientY > innerHeight - oMenuComputedHeight ? eVent.clientY - oMenuComputedHeight : eVent.clientY;
		oMenu.style.cssText += `left:${x}px;top:${y}px;`;
		//菜单功能项 ,委托
		oMenu.onclick = function(e) {
			//let Example=[c1,c2,c3,map,c5,c7,c8]
			let Example = [c1, c2, c3, map, c5, c7, c9];
			//let Example = [c1, c2, c3, map, c5,c7];
			let oBtnBack = sys.getel("[tool=back]")[0];
			let ExampleArgs; //被保护的实例[参数]
			function echartFullscreen(obj) { //全屏当前图表  并销毁其他实例,大幅提升性能					
				if(c7.getDom() == obj) { //传入的dom和c7的dom相同  就把词云字体设置得更大
					c7.setOption({
						series: [{
							name: '城市词云',
							sizeRange: [20, 60],
							gridSize: 8,
						}]
					});
				}
				if(c9.getDom()==obj){
					c9.setOption({
						grid: {
							right: 50,
							top: 50,
							bottom: 20,
							width: '93%',
							containLabel: true
						}
					});
				}
				//let SetOption = []; //保存销毁图表的option配置参数 以便恢复					
				echartFullscreenState = true; //图表全屏状态 ok
				//全屏后 不允许搜索表单出现  ctrl+f  检测该按钮是否隐藏  也可作出屏蔽.已经显示的搜索单也隐藏
				//sys.getel("[tool=search]")[0].style.display = "none";
				sys.getel("#search")[0].className = "";
				let oldStyle = obj.style.cssText;
				for(let i = 0; i < charts.length; i++) {
					charts[i].style.display = "none";
					sys.getel("#chartSum3")[0].style.display = "none"; //三表的框也隐藏
					//if(SetOption.length != Example.length) { //存过就不用存了							
					//	SetOption.push(Example[i].getOption()); //先存
					//}
				}
				obj.style.cssText = "display:block;width:15.2rem;border:none;background:none;height:7.8rem ;position:absolute;left:0px;top:0rem;margin:0;padding:0;z-index:1";
				let objAttr = obj.getAttribute("chart");
				console.log(objAttr);
				let clearEchart = function(debar) { //销毁其他实例  参数为排除的实例
					for(let i = 0; i < Example.length; i++) {
						//console.log(Example[i].getOption());
						if(Example[i] == debar) {
							//如果实例是保护的参数 什么也不做 把这个被保护的实例返回出去 给其他函数用
							ExampleArgs = Example[i];
						} else {
							if(Example[i] != c5 && Example[i] != c7) {
								//Example[i].clear();
							}
						}
					}; //把被保护的实例[参数] 供oBtnBack使用
				};
				oBtnBack.style.display = "block";
				oBtnBack.onclick = function() { //图表退出全屏  操作是异步的 代码在前面也可以
					//退出全屏  恢复搜索
					//退出后  把词云字体设置得小点

					sys.getel("[tool=search]")[0].style.display = "block";
					echartFullscreenState = false; //退出 改变图表全屏状态 
					for(let i = 0; i < charts.length; i++) {
						charts[i].style.display = "block"; //全部恢复显示
						sys.getel("#chartSum3")[0].style.display = "block"; //例外的三表框
					}
					this.style.display = "none"; //隐藏按钮
					obj.style.cssText = oldStyle; //当前对象退回原来样式
					ExampleArgs.resize(); //把被保护的实例(=全屏的实例) 样式跟随dom容器
					console.log(ExampleArgs)
					//let SetOptionLength = SetOption.length;
					if(ExampleArgs==c7){
						c7.setOption({
						series: [{
							name: '城市词云',
							sizeRange: [8, 30],
							gridSize: 2,
						}]
					});
					}else if(ExampleArgs==c9){
						c9.setOption({
							grid: {
								left: 0,
								right: 50,
								top: 50,
								bottom: 5,
								width: '91%',
								containLabel: true
							},
						});
					}
				
					//								for(let iSO = 0; iSO < SetOptionLength; iSO++) { //把option数据还原到实例
					//									if(SetOption[iSO]) {
					//										console.log(SetOption);
					//										if(Example[iSO] == c5) { //规避echarts bug
					//
					//										} else if(Example[iSO] == c7) {
					//											
					//										} else {
					//											//Example[iSO].setOption(SetOption[iSO]);
					//										}
					//									}
					//								}
					sys.getel("[menu=fullChart]")[0].style.display = "block"; //退出图表全屏 继续显示全屏菜单
					sys.clearHightLines();
				};
				switch(objAttr) {
					case "1":
						clearEchart(Example[0]); //参数是实例变量名 存在Example数组里
						c1.resize();
						break;
					case "2":
						clearEchart(Example[1]);
						c2.resize();
						break;
					case "3":
						clearEchart(Example[2]);
						c3.resize();
						break;
					case "4":
						clearEchart(Example[3]);
						map.resize();
						sys.clearHightLines();
						break;
					case "5":
						clearEchart(Example[4]);
						c5.resize();
						break;
					case "6": //c6.resize();clearEchart(Example[5]);
						break;
					case "7":
						clearEchart(Example[5]);
						c7.resize();
						break;
					case "8":
						//clearEchart(Example[6]);
						//c8.resize();
						break;
					case "9":
						clearEchart(Example[6]);
						//*就因为有transition 导致全屏时 大小未及时到达最后的状态,导致c9.resize()无效!!被坑了好久  一直排错*/
						c9.resize();
						break;
					default:
						console.log("这不是图表");
						break;
				}
			}
			let eVent = e || event;
			let oMenuEvent = eVent.target; //冒泡出的   响应事件的DOM
			let oMenuEventAttr = oMenuEvent.getAttribute("menu");
			let oMenuEventParentAttr = oMenuEvent.parentNode.getAttribute("menu"); //解决点击到图标上 和文字上问题
			//if(oMenuEventAttr || oMenuEventParentAttr); //如果自身或者父级有menu属性
			let eventNode = oMenuEventAttr || oMenuEventParentAttr;
			switch(eventNode) {
				case "fullChart":
					sys.getel("[menu=fullChart]")[0].style.display = "none"; //图表全屏 移出全屏菜单
					//巧妙利用定时器异步特性,等待页面全屏后的 c3 c5图样式代码执行之后在执行图表全屏
					setTimeout(function() {
						echartFullscreen(oAttrNode)
					}, 1); //调用全屏,传入触发oncontextmenu事件的对象(326行)
					//console.log(sys.getel("[menu=fullChart]")[0].style.display)
					break;
				case "refresh":
					window.location.reload();
					break; //取出实例  保存
				case "saveImage":
					//本来就在触发事件,不需要观察者模式  ...又费了时间  真傻.
					let instance = echarts.getInstanceByDom(oAttrNode);
					let base64 = instance.getDataURL({
						type: setUp.saveImageType,
						pixelRatio: 3 // 清晰度0-5最好
					});
					let a = doc.createElement('a');
					a.setAttribute('href', base64);
					a.setAttribute('download', '星云航班数据可视化');
					a.click();
					break;
				case "back":
					history.back();
					break;
				case "go":
					history.forward();
					break;
				case "info":
					break;
				case "view-source": //浏览器限制代码触发view-source协议查看源码,只能另寻办法了.获取整个根文档,包括自身标签:
					let source = sys.getel("#view-source")[0];
					source.style.display = 'block';
					source.innerHTML = document.documentElement.outerHTML;
					source.addEventListener('click', function() {
						if(source.innerHTML != '') {
							source.style.display = 'none';
						}
					});

					layui.use('code', function() { //加载code模块
						layui.code({
							elem: '#view-source',
							title: '部分前端源码ヾ(◍°∇°◍)ﾉﾞ其他的秘密不给看,只给html',
							encode: true,
							skin: 'notepad',
							about: false,
						}); //引用code方法
					});

					sys.getel("#view-source")[0].style.transform = "translateY(100vh)";
					break;
				default:
					return false;
					break;
			}
		}
		return false; //阻止默认菜单
	};

	//文档单击事件
	doc.addEventListener('click', function() {
		oMenu.style.display = "none";
		sys.getel("#about")[0].style.transform = "rotateZ(0deg) scale(0)";
	});
};
//搜索表单:
tool.search = function() {
	let singleTimeMo = "2018-2-1"; //默认的unix 时间
	let searchDateInput = sys.getel("#searchDate")[0];
	let input = sys.getel("#searchInput")[0];
	searchDateInput.addEventListener('click', function(e) {
		input.focus();
	});

	let singleValue = singleTimeMo.replace(/-/gim, '/');
	requestArg.singleTime = Date.parse(new Date(singleValue)) / 1000;
	layui.use('laydate', function() { //日历
		let layuidate = layui.laydate;
		layuidate.render({
			elem: '#searchDate', //指定元素
			range: true,
			value: '2018-2-3 - 2018-2-6',
			min: '2018-2-1',
			max: '2018-5-1',
			//btns: ['clear', 'confirm','now'],
			theme: '#0084FF',
			done: function(value, date, endDate) {
				//							console.log(value); //得到日期生成的值，如：2017-08-18
				//							console.log(date); //得到日期时间对象：{year: 2017, month: 8, date: 18, hours: 0, minutes: 0, seconds: 0}
				//							console.log(endDate); //得结束的日期时间对象，开启范围选择（range: true）才会返回。对象成员同上。														
				let arrValue = value.split(" - "); //由于都是 - 分割符(有空格),先拆分为两组  再正则过滤,-分隔符时间转时间戳有问题 需要 / 分隔符
				arrValue[0] = arrValue[0].replace(/-/gim, '/');
				arrValue[1] = arrValue[1].replace(/-/gim, '/');
				requestArg.startTime = Date.parse(new Date(arrValue[0])) / 1000;
				requestArg.endTime = Date.parse(new Date(arrValue[1])) / 1000;
				//console.log(requestArg.endTime - requestArg.startTime);
				if(requestArg.startTime == requestArg.endTime) {
					requestArg.endTime = requestArg.startTime + 86400;
					//console.log(requestArg.endTime);
				}
				if(requestArg.endTime - requestArg.startTime < 0) {
					let pop = new tool.FunPopup("星云提醒", "结束时间小于开始时间哦");
					pop.open(function() {

					});
				} else if((requestArg.endTime - requestArg.startTime) / 86400 >= 10) {
					let pop = new tool.FunPopup("星云温馨提醒", "您查询的时间超过10天,数据量较大,第一次加载可能较慢");
					pop.open(function() {

					});
				}
				console.log(requestArg.startTime);
				console.log(requestArg.endTime);
				//阻止出来的日历 默认获得焦点
				input.focus();
			}
		});
	});

	layui.use('laydate', function() { //日历
		let layuidate = layui.laydate;
		layuidate.render({
			elem: '#searchSingleDate', //指定元素
			range: false,
			value: '2018-2-1',
			min: '2018-2-1',
			max: '2018-5-1',
			btns: ['clear', 'confirm'],
			theme: '#0084FF',
			done: function(value, date, endDate) {
				//							console.log(value); //得到日期生成的值，如：2017-08-18
				//							console.log(date); //得到日期时间对象：{year: 2017, month: 8, date: 18, hours: 0, minutes: 0, seconds: 0}
				//							console.log(endDate); //得结束的日期时间对象，开启范围选择（range: true）才会返回。对象成员同上。														
				//let arrValue = value.split(" - "); //由于都是 - 分割符(有空格),先拆分为两组  再正则过滤,-分隔符时间转时间戳有问题 需要 / 分隔符
				let arrValue = value.replace(/-/gim, '/');
				//			arrValue[1] = arrValue[1].replace(/-/gim, '/');
				requestArg.singleTime = Date.parse(new Date(arrValue)) / 1000;
				//								if(requestArg.endTime - requestArg.startTime < 0) {
				//									let pop = new tool.FunPopup("星云提醒", "结束时间小于开始时间哦");
				//									pop.open(function() {
				//
				//									});
				//								}else if((requestArg.endTime - requestArg.startTime)/86400 >= 10) {	
				//									let pop = new tool.FunPopup("星云温馨提醒", "您查询的时间超过10天,数据量巨大,第一次加载可能较慢");
				//									pop.open(function() {
				//
				//									});
				//								}
				//时间选择完成  输入框取到焦点
				input.focus();
			}
		});
	});
	//转unix时间戳
	function timeUnix() {
		this.value = this.value.replace(/[>_<(?~？！){。\\}、\+%&$^@!=+\`\",.:*]/gim, '');
		let arrValue = this.value.split(" - "); //由于都是 - 分割符,先拆分为两组  再正则过滤,-分隔符时间转时间戳有问题 需要 / 分隔符
		arrValue[0] = arrValue[0].replace(/-/gim, '/'); //开始时间  ,结束时间
		arrValue[1] = arrValue[1].replace(/-/gim, '/');
		requestArg.startTime = Date.parse(new Date(arrValue[0])) / 1000;
		requestArg.endTime = Date.parse(new Date(arrValue[1])) / 1000;
		console.log(requestArg.startTime);
		console.log(requestArg.endTime);
		console.log(requestArg.endTime - requestArg.startTime);
		if(requestArg.endTime - requestArg.startTime < 0) {
			let pop = new tool.FunPopup("系统警告", "结束时间小于开始时间");
			pop.open(function() {

			});
		}
	}
	timeUnix.apply(searchDateInput, []);
	searchDateInput.oninput = function() {
		timeUnix.apply(searchDateInput, []);
	}
	let search_title = sys.getel("#search_title")[0];
	let search = sys.getel("#search")[0];
	let search_result_box = sys.getel("#search_result_box")[0];
	//这些对象鼠标按下  input不会失去焦点  阻止 mousedown的默认事件
	search_result_box.addEventListener("mousedown", function(e) {
		e.preventDefault();
	});
	sys.getel("#search #search_select")[0].addEventListener("mousedown", function(e) {
		e.preventDefault();
	});
	let searchInput = sys.getel("#searchInput")[0];
	//搜索框 显示 隐藏  ，自动获取焦点   焦点事件
	let btnSearch = sys.getel("[tool=search]")[0];
	//防止多次点击搜索快捷键或搜索按钮的bug 
	btnSearch.addEventListener("click", function() {
		if(search.className == "search_show") {
			return false;
		} else {
			search.className = "search_show";
		}

		searchInput.focus();
	});
	let btnSearchClose = sys.getel("#search .fa-close")[0];
	btnSearchClose.addEventListener('click', function() {
		search.className = "";
		search_result_box.style.transform = "scale(0)";
	});
	searchInput.addEventListener("focus", function() {
		search_result_box.style.transform = "scale(1)";
	});
	searchInput.addEventListener("blur", function() {
		search_result_box.style.transform = "scale(0)";
	});

	let searchStyle = search.style;
	let deviationX = 0,
		deviationY = 0,
		sumx = 0,
		sumy = 0;
	let stateDeviationX = 0;
	let state = true; //防止连续点击  而不移动的重复累加偏移量bug
	//拖动 使用css3技术  gpu重绘  性能更强
	search_title.onmousedown = function(e) {
		if(state) { //判断是否点击
			sumx += deviationX; //把移动最终偏移值累加(translate坐标相对于自身)
			sumy += deviationY;
			state = false; //第一次点击生效,否者想要生效  必须移动=>518row
		}
		let ev = e || event;
		let oldClint = {
			sx: ev.clientX,
			sy: ev.clientY
		};
		let youX = sumx - oldClint.sx; //先计算了已知的数据  ,不用移动时再计算,eMove.clientX-oldClint.sx+sumx,当前鼠标偏移量+累计偏移量
		let youY = sumy - oldClint.sy;
		doc.onmousemove = function(e) {
			state = true; //已经移动过(解决不停点击而不移动会不断累加  bug)					
			let eMove = e || event;
			//pageX和clentX一样  但是不会随着滚动条改变(始终为当前视觉 页面左上角)
			//left 和top改为transform 性能更强

			let nowClintX = eMove.clientX;
			let nowClintY = eMove.clientY;
			if(eMove.clientX >= innerWidth - 20) {
				nowClintX = innerWidth - 20;
			} else if(eMove.clientX <= 20) {
				nowClintX = 20;
			}
			if(eMove.clientY >= innerHeight - 20) {
				nowClintY = innerHeight - 20;
			} else if(eMove.clientY <= 20) {
				nowClintY = 20;
			}
			//console.log(eMove.clientX,innerWidth,search.offsetWidth)
			searchStyle.transform = `translateX(${nowClintX+youX}px) translateY(${nowClintY+youY}px)`; //let top版本等同search.offsetLeft+(新的鼠标位置-旧的鼠标位置),css3版  累加偏移量+当前偏移量	sumy+eMove.clientY-oldClint.sy,优化已知的	sumy-oldClint.sy再加									
			deviationX = nowClintX - oldClint.sx; //记录这次按下的最终偏移量
			deviationY = nowClintY - oldClint.sy;
		}
	}
	doc.onmouseup = function() {
		doc.onmousemove = null;
	};
	//search 下拉框
	(function() {
		requestArg.type = "城市名"; //默认请求参数
		let select = sys.getel("#search #search_select")[0];
		let selectName = sys.getel("[selectName]");
		let state = false; //下拉框展开状态
		let selectNameLength = selectName.length;
		let searchDate = sys.getel("#searchDate")[0];
		let searchSingleDate = sys.getel("#searchSingleDate")[0];
		for(let IselectList = 0; IselectList < selectNameLength; IselectList++) {
			selectName[IselectList].addEventListener('click', function(e) {
				
				if(state == false) { //下拉框关闭时
					let deviationY = 0.42;
					state = true;
					for(let i = 0; i < selectNameLength; i++) {
						switch(getComputedStyle(selectName[i]).zIndex) {
							case "3":
								selectName[i].removeAttribute("class");
								selectName[i].className = "selectZindex3Animation";
								break;
							case "2":
								selectName[i].style.transform = "translateY(" + deviationY + "rem)";
								break;
							case "1":
								selectName[i].style.transform = "translateY(" + deviationY * 2 + "rem)";
								break;
							default:
								console.log(getComputedStyle(selectName[i]).zIndex + ":异常");
								break;
						}
					}

				} else {
					state = false; //展开状态,下次收缩
					let activity = this;
					let selectName3;
					for(let i2 = 0; i2 < selectName.length; i2++) {
						//selectName[i2].addEventListener("click", function() {
						//for(let i3 = 0; i3 < selectName.length; i3++) {
						selectName[i2].style.transform = "translateY(0)";
						selectName[i2].className = ""; //回归位置与样式	

						if(getComputedStyle(selectName[i2]).zIndex == "3") {
							selectName3 = selectName[i2]; //找出现在哪个为3
						}

					}
					//把zIndex级别为3的与当前点击的元素互换zIndex 与top.
					activity.style.zIndex = getComputedStyle(selectName3).zIndex;
					activity.style.top = getComputedStyle(selectName3).top;
					selectName3.style.zIndex = getComputedStyle(activity).zIndex;
					selectName3.style.top = getComputedStyle(activity).top;
					//记录参数
					requestArg.type = activity.innerText;
					//每次点击 检查类型  更换不同日历:
					if(requestArg.type == "城市名") {
						searchDate.style.display = 'inline-block';
						searchSingleDate.style.display = 'none';
					} else if(requestArg.type == "航班号") {
						searchDate.style.display = 'none';
						searchSingleDate.style.display = 'inline-block';
					}else if(requestArg.type == "国家名"){
						requestArg.type = "城市名";
						location.hash='#optionMapPage';
						sys.getel("#search")[0].className='';
						sys.getel('[tool=optionCounty]')[0].click();
					}
					console.log("ajax参数" + requestArg.type);
				}
			});
		}
	})();
};

//		hash状态管理   切换与检测页面状态
(function() {
	let indexPage = sys.getel("#indexView")[0];
	let secondPage = sys.getel("#secondPage")[0];
	let chart = sys.getel("#chart")[0]; //包裹三个页面的div (#chart)
	let toolSwitch = sys.getel("[tool=switch]")[0]; //indexPage页面  切换简/聚合数据页面的按钮
	let info = sys.getel("#info")[0];
	let toolThreeStyle = sys.getel("[tool=language],[tool=help],[tool=chat]");
	let toolBackStyle = sys.getel("[tool=back]")[0];
	toolSwitch.addEventListener('click', function() {
		if(sys.getel(".secondPageAnimationClose")[0]) {
			info.style.opacity = '0';
			indexPage.style.opacity = "0";
			secondPage.className = "secondPageAnimationOpen";
		} else {
			info.style.opacity = '1';
			indexPage.style.opacity = "1";
			secondPage.className = "secondPageAnimationClose";
		}
	}, false);
	//帮助
	
	 if(sys.mySave.getsave('useCount')!=''){
	 	window.useCount=localStorage.getItem('useCount')
	 }else{
	 	//alert(2)
	 }
	toolThreeStyle[1].addEventListener('click',function(){
		welcome.style.display='block';
	});
	function checkHash() {
		let optionTool = sys.getel("#optionTool")[0];
		switch(location.hash) {
			case "#indexPage":
				chart.className = "indexPageAnimation";
				toolSwitch.style.display = "block";
				optionTool.style.display = 'none';
				toolThreeStyle[0].style.right = '1.78rem';
				toolThreeStyle[1].style.right = '2.15rem';
				toolThreeStyle[2].style.right = '2.55rem';
				toolBackStyle.style.right = '3rem';
				break;
			case "#optionMapPage":
				chart.className = "optionMapPageAnimation";
				toolSwitch.style.display = "none";
				optionTool.style.display = 'inline-block';
				toolThreeStyle[0].style.right = '1.35rem';
				toolThreeStyle[1].style.right = '1.7rem';
				toolThreeStyle[2].style.right = '2.1rem';
				toolBackStyle.style.right = '2.5rem';
				break;
			default:
				optionTool.style.display = 'none';
				//								chart.className = "indexPageAnimation";
				//								location.hash="#indexPage";
				//								toolSwitch.style.display="block";
				break;
		}
	};
	checkHash(); //载入页面的检测
	window.addEventListener("hashchange", function(e) {
		checkHash(); //hash改变时也触发
	}, false);

	//用户触发双页切换#indexPage #optionMapPage
	//键盘快捷键 ctrl+f搜索、←切换到左屏  →切换到右屏 

	let search = sys.getel("#search")[0];
	let searchInput = sys.getel("#searchInput")[0]; //搜索输入框
	let chat_input = sys.getel('#chat_input')[0]; //聊天输入框
	let side_text = sys.getel('#side_text')[0]; //侧边栏便笺输入框
	doc.addEventListener("keydown", function(eDown) {
		//console.log(eDown.keyCode); //键值
		if(eDown.keyCode == 37) { //按下并松开
			doc.addEventListener("keyup", function(eUp) {
				if(eUp.keyCode == 37) {
					if(searchInput == doc.activeElement || chat_input == doc.activeElement || side_text == doc.activeElement) {
						//输入框有焦点时  左右按键不切换页面  
					} else {
						//document.focus();//文档获得焦点
						location.hash = "#optionMapPage";
					}

				}
			});
		} else if(eDown.keyCode == 39) {
			doc.addEventListener("keyup", function(eUp) {
				if(eUp.keyCode == 39) { //按下并松开都是39
					if(searchInput == doc.activeElement || chat_input == doc.activeElement || side_text == doc.activeElement) {
						//输入框有焦点时  左右按键不切换页面  
					} else {
						//document.focus();//文档获得焦点
						location.hash = "#indexPage";
					}

				}
			});
		} else if(eDown.keyCode == 17) {
			doc.addEventListener("keydown", function(eUp) { //两次按下都是17  70
				if(eUp.keyCode == 70) {
					eUp.preventDefault(); //阻止浏览器默然ctrl + f搜索
					eUp.stopPropagation();
					if(search.className == "search_show") {
						return false; //解决 bug 搜索框在底部  拖动再连续crtl+f或者点击工具栏搜索按钮 后 搜索框使box向上移动
					} else { //如果搜索按钮隐藏，无响应。（目的是防止全屏后继续搜索 在已经销毁的内存上渲染数据引起错误）
						if(sys.getel("[tool=search]")[0].style.display == "none") {
							return false;
						} else {
							search.className = "search_show";
						}
					}
					searchInput.focus();
				}

			});

		} else if(eDown.keyCode == 40) {
			doc.addEventListener("keyup", function(eUp) {
				if(eUp.keyCode == 40) {
					indexPage.style.opacity = "1";
					secondPage.className = "secondPageAnimationClose";
				}
			});
		} else if(eDown.keyCode == 38) {
			doc.addEventListener("keyup", function(eUp) {
				if(eUp.keyCode == 38) {
					indexPage.style.opacity = "0";
					secondPage.className = "secondPageAnimationOpen";
				}
			});
		} else if(eDown.keyCode == 9) { //屏蔽tab按键,莫名其妙的加载页面后快速点击tab页面整体左移的bug
			eDown.preventDefault();
			return false;
		}

	});
})();

//			tool.request = function() {
//				sys.request("get", "/planeCount", params.name, function(data) {
//					returnValue = params.name + ' : ' + params.value[2];
//				}, function(err) {
//					returnValue = params.name + ' : ' + params.value[2];
//				});
//			}
window.onload = function() {

	//																let pop = new tool.FunPopup("系统警告", "确定删除吗?真的要删库?");
	//																pop.open(function() {
	//																	console.log("执行了");
	//																});
	tool.sideBar();
	tool.fullScreen("[tool=FullScreen]");
	tool.menu();
	tool.search();
	//tool.popup();
	//tool.search();
	//		地理连线配置
	//		let buffer = new ArrayBuffer(16);
	//		let int32View = new Int32Array(buffer);
	//		console.log(int32View.buffer);
	//
	//				function autoXianlu(from_to_data) {
	//					var iItem = 0;
	//					var iItem2 = 0;
	//					let arrItem = [];
	//					for(let item in myData.allCity) {
	//						for(let item2 in myData.allCity) {
	//							arrItem[iItem] = item2;
	//							iItem++;
	//						}
	//						let from_to = [{
	//								name: arrItem[iItem2]
	//							},
	//							{
	//								name: arrItem[iItem2 + 1],
	//								value: iItem2 / 2
	//							}
	//						];
	//						//console.log(SHData.length);
	//						from_to_data[from_to_data.length] = from_to;
	//						if(iItem2 <= 10) {
	//							iItem2++;
	//						}
	//
	//					}
	//
	//					//console.log(iItem2);
	//				};
	//autoXianlu(GZData);
	//	autoXianlu(SHData);
	//autoXianlu(BJData);
	let planePath = 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z';

	let series = [];

	series.push({
		type: "effectScatter",
		name: "hightScatter",
		geoIndex: 0,
		zlevel: 7,
		//showEffectOn: 'emphasis',
		animation: true,
		coordinateSystem: "geo",
		symbol: "circle",
		symbolSize: 12,
		label: {
			normal: {
				show: true,
				position: 'right',
				formatter: '{b}'
			}
		},
		itemStyle: {
			normal: {
				color: 'rgba(0,245,255,1)'
			}

		},
		data: []
	}, {
		name: '航线',
		type: 'lines',
		zlevel: 5,
		animation: true,
		blendMode: "lighter", //线条叠加越多的区域越亮
		//progressive: 300, //渐进式渲染 数量/s
		//progressiveThreshold: 1, //渐进式渲染开启阈(是yu值,不是fa  哈哈)值
		//	animationThreshold: -1, //数量 大于这个数不开启渲染动画
		polyline: false, //开启多线段
		large: true, //是否优化
		//largeThreshold: 5000, //优化阈值
		symbol: ['none', 'arrow'],
		symbolSize: 6,
		effect: {
			show: true,
			period: 10,
			trailLength: 0,
			symbol: planePath,
			symbolSize: 10,
			color: "rgba(0,245,255,1)"
		},
		lineStyle: {
			normal: {
				color: "rgba(100,149,237,1)",
				width: 1.5,
				opacity: 1,
				curveness: 0.3
			},
			emphasis: {
				width: 2,
				opacity: 1,
				color: "rgba(0,245,255,1)"
			}
		},
		/*data: convertData(item[1])*/
	}, {
		name: '城市',
		geoIndex: 0,
		zlevel: 6,
		//progressive: 500, //渐进式渲染 数量/s
		//progressiveThreshold: 2000, //渐进式渲染开启阈(是yu值,不是fa  哈哈)值
		type: 'scatter',
		coordinateSystem: 'geo',
		showEffectOn: 'emphasis',
		symbol: 'circle',
		label: {
			normal: {
				show: false,
				//position: 'right',
				//formatter: '{b}'
			}
		},
		hoverAnimation: true, //动画
		legendHoverLink: true, //图例hover联动高亮
		symbolSize: 7,
		itemStyle: {
			normal: {
				color: "#7FFF00"
			},
			emphasis: {
				color: "rgba(0,245,255,1)"
			}
		},
		data: null
	}, {
		name: '延误',
		type: 'lines',
		zlevel: 4,
		animation: true,
		//blendMode: "lighter", //线条叠加越多的区域越亮
		polyline: false, //开启多线段
		large: true, //是否优化
		symbol: ['none', 'arrow'],
		legendHoverLink: true,
		symbolSize: 0,
		effect: {
			show: false,
			period: 0,
			trailLength: 0,
			symbol: 'none',
		},
		lineStyle: {
			normal: {
				color: "rgba(255,255,0,1)",
				width: 1,
				opacity: 1,
				curveness: 0.35
			}
		},
		data: []
	}, {
		name: '取消',
		type: 'lines',
		hoverAnimation: true, //动画
		legendHoverLink: true, //图例hover联动高亮
		symbolSize: 7,
		lineStyle: {
			normal: {
				width: 2.5,
				color: "rgba(255,0,0,1)"
			},
			emphasis: {
				width: 3,
				color: "rgba(255,255,255,1)"
			}
		},
		data: []
	});
	//});
	//ditu配置项
	let option = {
		title: {
			text: '航线视图',
			subtext: '',
			left: 'center',
			textStyle: {
				color: '#fff'
			}
		},
		toolbox: {
			show: true,
			showTitle: true,
			feature: {
				restore: {},
				//							saveAsImage: {
				//								type: "jpeg", //png
				//								name: "星云航空数据可视化 地图", //默认保存图片为title
				//								backgroundColor: "black",
				//								pixelRatio: 1.5, //保存图片分辨率比例  	 		
				//							},
			}
		},
		//					visualMap: {
		//							type: "continuous",
		//							show: true,
		//							seriesIndex:1,
		//							calculable:true,//手
		//							min:Math.min.apply(null, data),
		//							max:100,
		//							textStyle:{
		//								color:'rgba(0,245,255,1)'
		//							},
		//							inRange: {
		//								color: ["rgba(255,255,255,1)", 'rgba(255,0,0,1)']
		//							},
		//							//dimension:1	////映射数组列  默认最后
		//						},
		tooltip: {
			trigger: 'item',
			formatter: function(params) {
				let returnValue = "空";
				if(location.hash == "#indexPage") {
					if(params.seriesType == "scatter" || params.seriesType == "effectScatter") {
						return params.name;
					} else if(params.seriesType == "lines") {
						return params.data.fromName + '>' + params.data.toName + "</br>" + "航班数:" + params.data.value + "架次";
					}
				} else {
					if(params.seriesType == "scatter" || params.seriesType == "effectScatter") {
						if(params.value[2]) { //如果有值
							if(params.value[3]) { //如果机场名加载完成
								return "城市名:" + params.name + "</br>月均起降:" + params.value[2] + "架次" + '</br>' + params.value[3];
							} else { //机场名加载中
								return "城市名:" + params.name + "</br>月均起降:" + params.value[2] + "架次" + '</br>' + '机场名加载中';
							}

						} else {
							params.value[2] = 0;
							if(params.value[3]) {
								return params.name + "</br>月均起降:" + '暂无数据' + '</br>' + params.value[3];
							} else {
								return params.name + "</br>月均起降:" + '暂无数据' + '</br>' + '机场名加载中';
							}

						}

					} else if(params.seriesType == "lines") {
						return params.data.fromName + '>' + params.data.toName + "</br>";
					}
				}

			}
		},
		//					visualMap: {
		//						name: "scatter",
		//						type: 'continuous', //视觉 映射 连续型
		//						min: 0,
		//						max: 1000,
		//						text: ['High 万人', 'Low'],
		//						realtime: false, //如果为ture则拖拽手柄过程中实时更新图表视图。false 结束后更新
		//						calculable: true, //是否显示拖拽用的手柄(最大和最小)
		//						inRange: { //手柄样式
		//							color: ['rgba(255,0,0,0.1)', 'rgba(255,0,0,0.3)', 'rgba(255,0,0,0.5)', 'rgba(255,0,0,0.7)', 'red'], //由小到大
		//							//'rgba(0,205,0,0.5)', 'rgba(0,0,255,1)', 'rgba(255,255,0,1)',
		//							symbolSize: [10, 40]
		//						},
		//					},
		//					brush: {
		//						seriesIndex: [0, 4],
		//						throttleType: 'debounce',
		//						throttleDelay: 300,
		//						geoIndex: 0,
		//					},
		geo: {
			map: 'world',
			geoIndex: 0,
			zoom: 1.2,
			center: [0, 20],
			label: {
				emphasis: {
					show: true
				}
			},
			roam: true,
			itemStyle: {
				normal: {
					borderWidth: 0.2,
					areaColor: 'rgb(12,97,156)',
					borderColor: '#404a59',
				},
				emphasis: {
					borderColor: 'rgba(0,0,0,0.2)',
					areaColor: 'rgba(0,0,0,0.2)'
				}
			},
			nameMap: {
				'China': '中国'
			}
		},
		legend: {
			orient: 'vertical',
			top: 'bottom',
			left: 'right',
			data: ['城市', '航线', '延误', '取消'],
			textStyle: {
				color: 'rgba(0,245,255,1)'
			},
			selected: {
				'取消': false,
				'延误': false
			},
			selectedMode: 'multiple',
			inactiveColor: 'rgba(100,100,100,1)',
		},
		series: series
	};
	//pie饼图:
	let pieOption = {
		color: [
			'#2ae0c8',
			'rgba(0,245,255,0.5)',
			'rgba(0,255,150,1)',
			'#fbb8ac',
			'#acf6ef',
			'#fad8be',
			'#cbf5fb',
			'#bdf3d4',
			'#e3c887',
			'#e6e2c3',
		],
		//backgroundColor: 'rgba(12,96,150,0.7)',
		textStyle: {
			color: 'rgba(0,245,255,1)',
			fontWeight: 'lighter'
		},
		title: {
			//	text: '成都市航班' + '来往国家Top榜',
			left: 'center',
			top: 10,
			textStyle: {
				color: 'rgba(0,245,255,0.8)',
				fontSize: 14
			}
		},
		tooltip: {
			trigger: 'item',
			formatter: "{a} <br/>{b} : {c} ({d}%)<br/>"
		},
		legend: {
			name: '国家图例',
			type: 'scroll',
			orient: 'vertical',
			top: 'bottom',
			left: 'right',
			formatter: function(name) {
				return echarts.format.truncateText(name, 60, '10px Microsoft Yahei'); //6个字符(3汉字)省略
			},
			//data: ['aaaaaaaaaa', '北京首都机场'],
			tooltip: {
				show: true
			},
			textStyle: {
				color: 'rgba(0,245,255,1)',
				fontSize: 10
			},
			selectedMode: 'multiple',
			inactiveColor: 'rgba(100,100,100,1)',
		},
		//					visualMap: {
		//						show: false,
		//						min: 0,
		//						max: 600,
		//						inRange: {
		//							colorLightness: [0, 1]
		//						}
		//					},
		series: [{
			id: "pie",
			name: '来往国家',
			type: 'pie',
			radius: [0, "80%"],
			center: ['42%', '50%'],
			hoverAnimation: true,
			data: [],
			selectedMode: true, //允许选中 分离
			minAngle: 5, //最小角度
			cursor: "pointer", //hover鼠标样式
			roseType: 'radius',
			label: {
				normal: {
					color: 'rgba(0, 245, 255, 0.6)'
				},
				emphasis: {
					color: 'rgba(0, 255, 255, 1)',
					fontWeight: "bold"
				},
			},
			labelLine: {
				normal: {
					lineStyle: {
						color: 'rgba(255, 255, 255, 0.3)'
					},
					smooth: 0,
					length: 6,
					length2: 6
				}
			},
			itemStyle: {
				normal: {
					borderWidth: 1,
					shadowBlur: 10,
					borderColor: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{
						offset: 0,
						color: 'rgba(0,245,255,1)'
					}, {
						offset: 1,
						color: '#70ffac'
					}]),
					shadowColor: 'rgba(142, 152, 241, 0.6)'
				},
				emphasis: {
					color: 'rgba(0,255,255,1)',
				}
			},
			animationType: 'scale',
			animationEasing: 'elasticOut',
			animationDelay: function(idx) {
				return Math.random() * 1000;
			}
		}]
	};
	//航司信息
	let airLineOption = {
		title: {
			x: 'center',
			text: '相关航司信息',
			textStyle: {
				fontSize: 14,
				color: 'rgba(0,245,255,0.7)'
			}
		},
		color: [
			'red', 'green', 'white', 'black', 'blue', 'yellow', '#d622ec', '#ed45df', '#fdffdb', '#49c1bf'
		],
		legend: {
			type: 'scroll',
			data: ['上海', '广州', '北京123456789', '纽约'],
			left: 'right',
			orient: 'vertical',
			selectedMode: 'multiple',
			formatter: function(name) {
				return echarts.format.truncateText(name, 60, '10px Microsoft Yahei'); //6个字符(3汉字)省略
			},
			textStyle: {
				color: 'rgba(0,245,255,1)',
				fontSize: 10,
			},
			inactiveColor: 'rgba(100,100,100,1)',
			tooltip: {
				show: true
			}
		},
		tooltip: {
			show: true,
			trigger: 'item',
			formatter: "加油"
		},
		realtime: false,
		//					areaSelectStyle: { //在坐标轴上可以进行框选，这里是一些框选的设置。
		//						width: 20, //框选范围的宽度。
		//						borderWidth: 5, //选框的边框宽度。
		//						borderColor: 'rgba(0,245,255,1)', //选框的边框颜色。
		//						color: 'rgba(0,245,255,1)', //选框的填充色。
		//						opacity: 0.6, //选框的透明度。
		//					},
		parallelAxis: [ // 这是一个个『坐标轴』的定义
			{
				dim: 0,
				name: '经营规模'
			}, // 每个『坐标轴』有个 'dim' 属性，表示坐标轴的维度号。
			{
				dim: 1,
				name: '延误数'
			},
			{
				dim: 2,
				name: '准点率(%)'
			},
			{
				dim: 3,
				name: '延误时长(分)',
				//							type: 'category', // 坐标轴也可以支持类别型数据
				//							data: ['分段','二','优秀'],
				//color:"rgba(0,245,255,0.8)"
			}
		],
		parallel: { //坐标系
			left: 30,
			bottom: '9%',
			top: "10%",
			right: 85,
			width: 'auto',
			parallelAxisDefault: { // 『坐标轴』的公有属性可以配置在这里避免重复书写
				type: 'value',
				nameLocation: 'start',
				nameGap: 8,
				triggerEvent: true,
				nameTextStyle: {
					color: 'rgba(0,245,255,0.8)'
				},
				axisLine: {
					lineStyle: {
						color: 'rgba(0,245,255,0.8)',
						width: 2
					}
				}
			},

		},
		series: [ // 这里三个系列共用一个平行坐标系
			{
				smooth: true,
				name: '北京123456789',
				type: 'parallel', // 这个系列类型是 'parallel'
				data: [
					[1, 0.05, 9, 1],
					[2, 0.69, 11, 1],
				]
			},
			{
				name: '上海',
				type: 'parallel',
				lineStyle: {
					color: 'black'
				},
				data: [
					[3, 0.9, 7, 0.1],
					[4, 0.78, 7, 0.5],
				]
			},
			{
				name: '广州',
				type: 'parallel',
				lineStyle: {},
				data: [
					[4, 0.9, 7, 0.6],
					[5, 0.1, 24, 0.9],
				]
			},
			{
				name: '纽约',
				type: 'parallel',
				lineStyle: {},
				data: [
					[4, 0, 158, 0.6],
					[5, 0.9, 214, 0.9],
				]
			}
		]
	};
	//时间轴 
	//数据
	//				let all = {
	//					"data": [
	//						[537, 120, 110, 449],
	//						[145, 130, 917, 142],
	//						[341, 413, 282, 741],
	//						[441, 513, 672, 441]
	//					],
	//					"rote": [
	//						//						[12.0, 13.4, 15.0, 44.9],
	//						//						[14.5, 13.0, 91.7, 12],
	//						//						[34.1, 41.3, 28.2, 74.1],
	//						//						[44.1, 51.3, 67.2, 44.1]
	//					],
	//					pie: [
	//						[{
	//							name: '一点',
	//							value: 100,
	//							itemStyle: {
	//								normal: {
	//									color: 'red'
	//								},
	//								emphasis: {
	//									color: 'rgba(0,255,255,1)',
	//								}
	//							},
	//						}, {
	//							name: '二点',
	//							value: 150,
	//						}, {
	//							name: '三点',
	//							value: 1010,
	//						}],
	//						[{
	//							name: '一点',
	//							value: 157,
	//						}, {
	//							name: '二点',
	//							value: 150,
	//						}, {
	//							name: '三点',
	//							value: 10,
	//						}],
	//						[{
	//							name: '一点',
	//							value: 100,
	//						}, {
	//							name: '二点',
	//							value: 150,
	//						}, {
	//							name: '三点',
	//							value: 1010,
	//						}],
	//						[{
	//							name: '一点',
	//							value: 100,
	//						}, {
	//							name: '二点',
	//							value: 150,
	//						}, {
	//							name: '三点',
	//							value: 1010,
	//						}],
	//						[{
	//							name: '一点',
	//							value: 100,
	//						}, {
	//							name: '二点',
	//							value: 150,
	//						}, {
	//							name: '三点',
	//							value: 1010,
	//						}],
	//						[{
	//							name: '一点',
	//							value: 100,
	//						}, {
	//							name: '二点',
	//							value: 150,
	//						}, {
	//							name: '三点',
	//							value: 1010,
	//						}]
	//					],
	//					flightsType: ["航班总数", "正常数", "延误数", "取消数"],
	//					times: ["合计", "3月24日", "3月-25日", "3-26"]
	//				};

	//series样式
	var itemStyle = {
		normal: {
			color: new echarts.graphic.LinearGradient(
				0, 1, 0, 0, [{
					offset: 0,
					color: '#2af598'
				}, {
					offset: 1,
					color: '#009efd'
				}]
			),
			barBorderRadius: 8
		},
		emphasis: {
			color: new echarts.graphic.LinearGradient(
				0, 1, 0, 0, [{
					offset: 0,
					color: 'rgba(0,245,255,1)'
				}, {
					offset: 1,
					color: 'red'
				}]
			),
			barBorderRadius: 4
		}
	};

	let timeData = [];
	let timedatadata = [];
	//timeLine  baseOption为基础组件,后面的options的data按顺序对应
	for(var n = 0; n < 1; n++) {
		//timedatadata.push(all.times[n]);
		timeData.push({
			title: {
				left: 'center',
				show: true,
				//text: all.times[n],
				subtext: "2月3日 ~ 2月-6日 成都市航班概览 ",
				textStyle: {
					color: 'rgba(0,245,255,1)'
				}
			},
			tooltip: {
				trigger: 'axis'
			},
			calculable: true,
			grid: {
				botom: 0,
				left: '5%',
				width: "60%"
			},
			xAxis: [{
				type: 'category',
				textStyle: {
					color: 'rgba(0,245,255,1)'
				},
				axisLabel: {
					color: 'rgba(0,245,255,1)',
					interval: 0,
					rotate: 0
				},
				//data: all.flightsType
			}],
			yAxis: [{
				type: 'value',
				name: '航班数(架次)',
				axisLine: {
					show: true,
					lineStyle: {
						color: 'rgba(0,245,255,1)' //轴文字色取自这
					}
				},
				textStyle: {
					color: 'rgba(0,245,255,0.7)'
				},
				axisLabel: {
					//color:'rgba(0,245,255,1)',
					interval: 0,
					rotate: 45,
					textStyle: {
						color: 'rgba(0,245,255,0.7)'
					}
				},
			}],
			series: [{
					name: '航班',
					yAxisIndex: 0,
					type: 'bar',
					itemStyle: itemStyle,
					barWidth: 40,
					label: {
						normal: {
							textStyle: {
								color: 'rgba(0,245,255,0.5)'
							},
							show: true,
							position: 'top',
							formatter: '{c}'
						}
					},
					//data: all.data[n]
				},
				{
					name: '各类航班数量比重',
					//data: []
				},
			]
		});
	};
	// time 配置项

	let timeOption = {
		baseOption: {
			color: ['green', 'yellow', 'red'],
			timeline: {
				currentIndex: 0,
				left: "5",
				bottom: 0,
				width: "95%",
				axisType: 'category',
				show: true,
				checkpointStyle: {
					symbol: 'diamond',
					symbolSize: 15,
					color: 'rgba(0,245,255,1)',
					borderWidth: 2,
					borderColor: 'rgba(255,0,0,1)',
					animationDuration: 300
				},
				controlStyle: {
					normal: {
						color: 'rgba(0,245,255,1)',
						borderColor: "rgba(0,245,255,1)"
					},
				},
				label: {
					normal: {
						color: 'rgba(0,245,255,0.8)',
					},
					emphasis: {

					}
				},

				lineStyle: {
					color: 'rgba(0,245,255,1)',
				},
				autoPlay: true,
				playInterval: 2000,
				data: timedatadata
			},
			legend: {
				show: true,
				x: 'right',
				y: 'top',
				orient: 'vertical',
				selectedMode: 'multiple',
				data: ['正常', '延误', '取消'],
				textStyle: {
					color: 'rgba(0,245,255,1)',
				},
				inactiveColor: 'rgba(100,100,100,1)',
			},
			grid: {
				botom: 0,
				left: '5%',
				width: "60%"
			},
			xAxis: [{
				type: 'category',
				textStyle: {
					color: 'rgba(0,245,255,1)'
				},
				axisLabel: {
					color: 'rgba(0,245,255,1)',
					interval: 0,
					rotate: 0
				},
				data: ["航班总数", "正常数", "延误数", "取消数"]
			}],
			yAxis: [{
				type: 'value',
				name: '航班数(架次)',
				axisLine: {
					show: true,
					lineStyle: {
						color: 'rgba(0,245,255,1)' //轴文字色取自这
					}
				},
				textStyle: {
					color: 'rgba(0,245,255,0.7)'
				},
				axisLabel: {
					//color:'rgba(0,245,255,1)',
					interval: 0,
					rotate: 45,
					textStyle: {
						color: 'rgba(0,245,255,0.7)'
					}
				},
			}],
			series: [{
					type: 'bar'
				},
				{
					name: '各类航班数量比重',
					tooltip: {
						show: true,
						trigger: 'item'
					},
					itemStyle: {
						normal: {
							borderWidth: 5,
							shadowBlur: 30,
							borderColor: 'rgba(0,245,255,0.5)',
							shadowColor: 'rgba(142, 152, 241, 0.6)'
						}
					},

					type: 'pie',
					radius: ['65%', "75%"],
					center: ['78%', '45%'],
					labelLine: {
						normal: {
							length: 3
						}
					},
					hoverAnimation: true,
					data: []
				}
			]
		},
		options: timeData

	};
	//c9  日历  转时间戳用

	let c9shuiqiu = {
		tooltip: {
			show: false
		},
		series: [{
			name: 'shuiqiu',
			type: 'liquidFill',
			waveAnimation: true,
			amplitude: 3,
			animationDuration: 10, //静止 提高性能
			center: ['50%', '50%'],
			//data: [0.6, 0.4],
			radius: '95%',
			color: ['#564d12', '#a1a126'],
			outline: {
				show: false
			},
			backgroundStyle: {
				borderColor: 'rgba(0,245,255,1)',
				borderWidth: 2,
				shadowColor: 'rgba(0,245,255, 0.4)',
				shadowBlur: 20
			},
			shape: 'path://M24 19.999l-5.713-5.713 13.713-10.286-4-4-17.141 6.858-5.397-5.397c-1.556-1.556-3.728-1.928-4.828-0.828s-0.727 3.273 0.828 4.828l5.396 5.396-6.858 17.143 4 4 10.287-13.715 5.713 5.713v7.999h4l2-6 6-2v-4l-7.999 0z',
			label: {
				align: 'center',
				normal: {
					align: 'center',
					formatter: function() {
						return '   总耗油\n 125888847加仑';
					},
					textStyle: {
						align: 'center',
						fontSize: 20,
						color: '#D94854'
					}
				}
			}
		}]

	};
	c9.setOption(c9shuiqiu);
	//								c9.on('click', function(p) {
	//									console.log(p)
	//								});
	//条形图
	//let defaultGlobalColor = ['#65F5F3', '#EAE643', '#F56565']

	//				barData.sort(function(x,y) {//降序
	//					if(x > y) {
	//						return 1;
	//					} else if(x < y) {
	//						return -1;
	//					} else {
	//						return 0;
	//					}
	//				});
	let rankingOption = {
		title: [{
			text: "成都市航线繁荣度全揽",
			left: 'center',
			textStyle: {
				color: 'rgba(0,245,255,0.7)',
				fontSize: 14,
			}

		}],
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: "shadow"
			},
		},
		legend: {
			name: '出入港',
			orient: 'vertical',
			top: 'bottom',
			left: 'right',
			data: ['出港', '入港'],
			textStyle: {
				color: 'rgba(0,245,255,0.8)'
			},
			selectedMode: 'single',
			inactiveColor: 'rgba(100,100,100,1)',
		},
		grid: {
			left: 12,
			right: 0,
			top: 20,
			bottom: 0,
			width: '95%',
			containLabel: true
		},
		xAxis: {
			name: '/架次',
			nameLocation: 'end',
			type: 'value',
			label: {
				show: true
			},
			scale: false,
			position: 'top',
			boundaryGap: false,
			splitLine: { //刻度轴线
				show: true, //刻度不从最小值开始
				lineStyle: {
					color: 'rgba(0,245,255,0.5)'
				}
			},
			axisTick: {
				show: true,
				alignWithLabel: false, //强制刻度对齐
				inside: true, //刻度朝内
			},
			axisLine: {
				show: true,
				lineStyle: {
					color: 'rgba(0,245,255,1)' //轴文字色取自这
				}
			},
			axisLabel: {
				rotate: 0,
				margin: 0,
				textStyle: {
					color: 'rgba(0,245,255,1)'
				}
			},
			data: []
		},
		yAxis: {
			type: 'category',
			nameLocation: 'end',
			name: '城市名',
			nameGap: 16,
			axisLine: {
				show: false,
				lineStyle: {
					color: 'rgba(0,245,255,1)'
				}
			},
			axisTick: {
				show: false,
				lineStyle: {
					color: 'rgba(0,245,255,1)'
				}
			},
			axisLabel: {
				interval: 'auto', //0显示全部,1 隔一个显示一个
				formatter: function(value) {
					if(value.length > 8) { //防止y轴文字过长 整个坐标系离开
						return value.substring(0, 8) + "..."
					} else {
						return value
					}
				},
				axisLabel: {
					interval: 'auto'
				},
				textStyle: {
					color: '#fff'
				}
			},
			//data: ["北京", "成都", "纽约", "上海", "洛杉矶", "伦敦", "柏林", "曼谷", "东京", "芝加哥", "神户", "莫斯科"]
		},
		series: [{
				name: "出港",
				type: 'bar',
				stack: "sum",
				itemStyle: {
					normal: {
						color: new echarts.graphic.LinearGradient(5, 1, 5, 0, [{
							offset: 1,
							color: 'rgba(0,245,255,0.5)'
						}, {
							offset: 0,
							color: '#00fcae'
						}]),
					},
					emphasis: {
						//color: 'rgba(100,245,255,1)'											
					}
				},
				//data: outData
			},
			{
				name: "入港",
				type: 'bar',
				stack: "sum",
				itemStyle: {
					normal: {
						color: new echarts.graphic.LinearGradient(5, 1, 5, 0, [{
							offset: 0,
							color: 'rgba(255,140,0,0.8)'
						}, {
							offset: 1,
							color: '#EE0000'
						}]),
					},
					emphasis: {
						//color: 'rgba(100,245,255,1)'											
					}
				},
				label: {
					//							normal: { 
					//								show: true,
					//								position: 'right',
					//								formatter: function(p){
					//									//console.log(p)
					//									//return sumData()[p.dataIndex]
					//								},
					//								textStyle: {
					//									color: 'rgba(255,245,255,1)'
					//								}
					//							}
				},
				//data: inData
			},
			//						{
			//						name: '出入港总和',
			//						type: 'bar',
			//						stack: 'sum',
			//						label: {
			//							normal: {
			//								offset:['50', '80'],  
			//								show: true,
			//								position: 'right',
			//								formatter: '{c}',
			//								textStyle: {
			//									color: '#000'
			//								}
			//							}
			//						},
			//						itemStyle: {
			//							normal: {
			//								color: 'rgba(128, 128, 128, 0)'
			//							}
			//						},
			//						data: sumData()
			//					}
		]
	};
	secondXy.setOption({
		grid: {
			show: false,
			top: 0,
		},
		xAxis: [{
			gridIndex: 0,
			type: 'value',
			show: false,
			min: 0,
			max: 100,
			nameLocation: 'middle',
			nameGap: 5
		}],
		yAxis: [{
			gridIndex: 0,
			min: 0,
			show: false,
			max: 100,
			nameLocation: 'middle',
			nameGap: 30
		}],
		tooltip: {
			show: true,
			trigger: 'item',
			formatter: function(params) {
				let arr = (params.name).split('\n');
				return arr[1] + '</br>' + arr[0]
			}
		},
		series: [{
			name: '航班详细信息',
			type: 'effectScatter',
			showEffectOn: 'emphasis',
			symbol: 'circle',
			symbolSize: 120,
			label: {
				normal: {
					show: true,
					formatter: '{b}',
					color: 'rgba(90,90,90,1)',
					textStyle: {
						fontSize: 16
					}
				},
			},
			itemStyle: {
				normal: {
					borderWidth: 5,
					shadowBlur: 15,
					shadowColor: 'rgba(0, 245, 255, 1)',
					borderColor: 'rgba(0,245,255,0.6)',
					color: 'rgba(0,245,255,1)',
					opacity: 1
				}
			},
			data: [{
				name: '2月1日8时0分' + '\n' + "计划起飞",
				value: [5, 70],
				symbolSize: 100,
				label: {
					normal: {
						textStyle: {
							fontSize: 16
						}
					}
				},
			}, {
				name: '2月1日8时19分' + '\n' + "实际起飞",
				value: [35, 70],
				symbolSize: 100,
				itemStyle: {
					normal: {
						color: '#FA8BFF',
						opacity: 1
					}
				},
			}, {
				name: '2月1日10时41分' + '\n' + "计划到达",
				value: [65, 70],
				symbolSize: 100,
				itemStyle: {
					normal: {
						color: '#2BD2FF',
						opacity: 1
					}
				},
			}, {
				name: '2月1日11时51分' + '\n' + "实际到达",
				value: [95, 70],
				symbolSize: 100,
				itemStyle: {
					normal: {
						color: '#a2e1d4',
						opacity: 1
					}
				},
			}, {
				name: '1077海里' + '\n' + "直线距离",
				value: [20, 50],
				symbolSize: 100,
				itemStyle: {
					normal: {
						color: '#2ae0c8',
						opacity: 1
					}
				},
			}, {
				name: '1393海里' + '\n' + "实际飞行距离",
				value: [50, 50],
				symbolSize: 100,
				itemStyle: {
					normal: {
						color: '#2BFF88',
						opacity: 1
					}
				},
			}, {
				name: '315' + '\n' + "飞行速度(节)",
				value: [80, 50],
				symbolSize: 100,
				itemStyle: {
					normal: {
						color: '#FF6A88',
						opacity: 1
					}
				},
			}, {
				name: 'Air China' + '\n' + "航空公司",
				value: [35, 30],
				symbolSize: 100,
				itemStyle: {
					normal: {
						color: '#9FACE6',
						opacity: 1
					}
				},
			}, {
				name: 'A321' + '\n' + "飞机型号",
				value: [65, 30],
				symbolSize: 100,
				itemStyle: {
					normal: {
						color: '#bd03d4',
						opacity: 1
					}
				},
			}, {
				name: '3900' + '加仑' + '\n' + "耗油量",
				value: [50, 10],
				symbolSize: 100,
				itemStyle: {
					normal: {
						color: '#e3c887',
						opacity: 1
					}
				},
			}]
		}]
	});
	//配置数据
	(function() {
		map.on('mouseover', function(params) {

		});
		map.on('click', function(params) {
			console.log(params)
			if(params.componentSubType == "lines") { //点击的对象是线条
				console.log(params.data.fromName + ">" + params.data.toName); //来去城市
				console.log(map.getOption());
				let oMapOption = map.getOption();
			} else if(params.componentSubType == "scatter") { //散点 
				console.log(params.name); //城市名		

				if(aHighlightEd.indexOf(params.dataIndex) == -1) { //没找到													
					map.dispatchAction({ //高亮
						type: 'highlight',
						seriesName: ['航线', '城市'],
						dataIndex: params.dataIndex
					});
					aHighlightEd.push(params.dataIndex); //且记录哪些高亮了		
				} else {
					let dataIndexOf = aHighlightEd.indexOf(params.dataIndex);
					if(dataIndexOf != -1) { //如果已经存在  就取消高亮
						map.dispatchAction({
							type: 'downplay',
							seriesName: ['航线', '城市'],
							dataIndex: params.dataIndex
						});
						aHighlightEd.splice(dataIndexOf, 1);
					}
				}
				console.log(aHighlightEd);
				params.data.value.push("一百");
				console.log(params.data);
				// console.log(option.series[0].data[params.dataIndex]);	//params是所有参数  dataIndex是数组索引值		 	
			}
		});

		//加载机场  与本地存储
		optionMap.on('mouseover', function(params) {
			if(params.componentSubType == "effectScatter" || params.componentSubType == "scatter") {
				//存下机场名,如果有就直接取,没有再请求并且保存
				let arrAirportName = myData.allAirport[params.name];
				let strAirportName = '机场:</br>';
				for(let i = 0; i < arrAirportName.length; i++) {
					strAirportName += arrAirportName[i] + '</br>'
				}
				params.data.value[3] = strAirportName;
				setTimeout(function() {
					params.data.value[3] = strAirportName;
				}, 100);
				//console.log(params.data)
			}

		});

		//					map.on("georoam", function(params) {
		//						console.log(map.getOption().geo[0]); //geo信息
		//						let geo = map.getOption().geo[0];
		//						let x = geo.center[0]; //经度
		//						let y = geo.center[1]; //纬度
		//						let zoom = geo.zoom; //纬度
		//						if(x > 73 && x < 136 && y > 4 && y < 54 && zoom > 3) {
		//							console.log("中国");
		////							let chinaSeries = {
		////								type: "map",
		////								mapType: "china",
		////								geoIndex: 0
		////							} 											
		//							map.setOption({
		//								geo: {
		//									map: "china",
		//									roam:true,
		//									zoom:1
		//									//center:[110,30]
		//								}
		//							});
		//							//console.log(map.getOption().series);
		//							//console.log(map)
		//							//option.series.push(chinaSeries);
		//							//console.log(option);
		//							//map.setOption(option);
		//							//map.series.push(chinaSeries);
		//							//console.log(map.getOption())
		//							//							map.setOption({
		//							//								series:
		//							//							});
		//						} 
		//					});
		//					map.on("dblclick", function(params) {
		//						map.setOption({
		//								geo: {
		//									map: "world",
		//									zoom:1
		//								}
		//							});
		//					});
	})();

	//	setTimeout(function () {
	//  map.dispatchAction({
	//      type: 'brush',
	//      areas: [
	//          {
	//              geoIndex: 0,
	//              brushType: 'polygon',
	//              coordRange: [[119.72,34.85],[119.68,34.85],[119.5,34.84],[119.19,34.77],[118.76,34.63],[118.6,34.6],[118.46,34.6],[118.33,34.57],[118.05,34.56],[117.6,34.56],[117.41,34.56],[117.25,34.56],[117.11,34.56],[117.02,34.56],[117,34.56],[116.94,34.56],[116.94,34.55],[116.9,34.5],[116.88,34.44],[116.88,34.37],[116.88,34.33],[116.88,34.24],[116.92,34.15],[116.98,34.09],[117.05,34.06],[117.19,33.96],[117.29,33.9],[117.43,33.8],[117.49,33.75],[117.54,33.68],[117.6,33.65],[117.62,33.61],[117.64,33.59],[117.68,33.58],[117.7,33.52],[117.74,33.5],[117.74,33.46],[117.8,33.44],[117.82,33.41],[117.86,33.37],[117.9,33.3],[117.9,33.28],[117.9,33.27],[118.09,32.97],[118.21,32.7],[118.29,32.56],[118.31,32.5],[118.35,32.46],[118.35,32.42],[118.35,32.36],[118.35,32.34],[118.37,32.24],[118.37,32.14],[118.37,32.09],[118.44,32.05],[118.46,32.01],[118.54,31.98],[118.6,31.93],[118.68,31.86],[118.72,31.8],[118.74,31.78],[118.76,31.74],[118.78,31.7],[118.82,31.64],[118.82,31.62],[118.86,31.58],[118.86,31.55],[118.88,31.54],[118.88,31.52],[118.9,31.51],[118.91,31.48],[118.93,31.43],[118.95,31.4],[118.97,31.39],[118.97,31.37],[118.97,31.34],[118.97,31.27],[118.97,31.21],[118.97,31.17],[118.97,31.12],[118.97,31.02],[118.97,30.93],[118.97,30.87],[118.97,30.85],[118.95,30.8],[118.95,30.77],[118.95,30.76],[118.93,30.7],[118.91,30.63],[118.91,30.61],[118.91,30.6],[118.9,30.6],[118.88,30.54],[118.88,30.51],[118.86,30.51],[118.86,30.46],[118.72,30.18],[118.68,30.1],[118.66,30.07],[118.62,29.91],[118.56,29.73],[118.52,29.63],[118.48,29.51],[118.44,29.42],[118.44,29.32],[118.43,29.19],[118.43,29.14],[118.43,29.08],[118.44,29.05],[118.46,29.05],[118.6,28.95],[118.64,28.94],[119.07,28.51],[119.25,28.41],[119.36,28.28],[119.46,28.19],[119.54,28.13],[119.66,28.03],[119.78,28],[119.87,27.94],[120.03,27.86],[120.17,27.79],[120.23,27.76],[120.3,27.72],[120.42,27.66],[120.52,27.64],[120.58,27.63],[120.64,27.63],[120.77,27.63],[120.89,27.61],[120.97,27.6],[121.07,27.59],[121.15,27.59],[121.28,27.59],[121.38,27.61],[121.56,27.73],[121.73,27.89],[122.03,28.2],[122.3,28.5],[122.46,28.72],[122.5,28.77],[122.54,28.82],[122.56,28.82],[122.58,28.85],[122.6,28.86],[122.61,28.91],[122.71,29.02],[122.73,29.08],[122.93,29.44],[122.99,29.54],[123.03,29.66],[123.05,29.73],[123.16,29.92],[123.24,30.02],[123.28,30.13],[123.32,30.29],[123.36,30.36],[123.36,30.55],[123.36,30.74],[123.36,31.05],[123.36,31.14],[123.36,31.26],[123.38,31.42],[123.46,31.74],[123.48,31.83],[123.48,31.95],[123.46,32.09],[123.34,32.25],[123.22,32.39],[123.12,32.46],[123.07,32.48],[123.05,32.49],[122.97,32.53],[122.91,32.59],[122.83,32.81],[122.77,32.87],[122.71,32.9],[122.56,32.97],[122.38,33.05],[122.3,33.12],[122.26,33.15],[122.22,33.21],[122.22,33.3],[122.22,33.39],[122.18,33.44],[122.07,33.56],[121.99,33.69],[121.89,33.78],[121.69,34.02],[121.66,34.05],[121.64,34.08]]
	//          }
	//      ]
	//  });
	//}, 0);

	map.setOption(option);
	c1.setOption(rankingOption);
	c3.setOption(pieOption);
	c2.setOption(airLineOption);
	c5.setOption(timeOption);
	optionMap.setOption(option);
	//map.on('brushselected', renderBrushed);
	//				layui.use('layer', function() {
	//					var layer = layui.layer;
	//
	//					layer.msg('欢迎来到航空数据系统');
	//					setTimeout(function() {
	//						layer.open({
	//							title: "系统提示",
	//							content: "这是系统提示啊啊",
	//							shade: 0,
	//							time: 0,
	//							anim: 3
	//						});
	//					}, 3000);
	//
	//				});
	let word = {
		title: {
			text: '成都市通航城市词云图',
			x: 'center',
			textStyle: {
				fontSize: 14,
				color: "rgba(0,245,255,0.7)"
			}

		},
		backgroundColor: '#F7F7F7',
		tooltip: {
			show: true
		},
		series: [{
			name: '城市词云',
			type: 'wordCloud',
			sizeRange: [10, 40], //大小范围
			rotationRange: [-90, 90], //倾斜范围
			rotationStep: 5, //倾斜步进度
			shape: 'polygon',
			//maskImage:planeImg,
			top: '5%',
			bottom: '2%',
			width: '100%',
			height: '100%',
			textPadding: 0,
			drawOutOfBound: false, //词云大于画布
			gridSize: 2,
			textStyle: {
				normal: {
					color: function() {
						return 'rgb(' + [
							Math.round(Math.random() * 255),
							Math.round(Math.random() * 255),
							Math.round(Math.random() * 255)
						].join(',') + ')';
					}
				}
			},
			//data: scatter.data
		}]
	};
	c7.setOption(word);

	function importantCity(e) { //e传入一个对象,城市名和经纬度
		let input = sys.getel("#searchInput")[0];
		let warn = sys.getel("#search_result_box i")[0]; //首行的提醒
		let inputValue; //处理后的value
		let search_result_box = sys.getel("#search_result_box")[0];
		let timer = null;
		let timer2 = null;
		let oHeaderType = sys.getel("#headType div");
		let requestURL = ''; //全部,国内,国际				
		let headClassName = 'headType_class';
		let search_box = sys.getel("#search")[0]; //搜索单 
		search_box.addEventListener('mousedown', function(e) {
			//e.preventDefault();//不失去焦点
			e.stopPropagation();
		});
		lastTime = {
			data: {
				name: e.data.name,
				xy: myData.allCity[e.data.name]
			},
		};
		indexDB.set('lastTime', lastTime, function() {}, function() {});
		let loading = sys.getel("#loading")[0];
		sys.getel('#headType')[0].addEventListener('mousedown', function(e) {
			e.preventDefault(); //输入框不失去焦点
		});
		let updateURL = function() { //更新出入港url
			if(oHeaderType[0].className == headClassName) {
				requestURL = "/node/out/city";
			} else if(oHeaderType[1].className == headClassName) {
				requestURL = "/node/out/city/home";
			} else {
				requestURL = "/node/out/city/county";
			}
		};
		updateURL();
		//成都 默认值 全部的,  航班数 城市数 updateDesc('出港',);
		for(let i = 0; i < oHeaderType.length; i++) { //先把所有清空  给当前点击的添加class
			oHeaderType[i].addEventListener('click', function(e) {
				for(let ii = 0; ii < oHeaderType.length; ii++) {
					oHeaderType[ii].className = '';
				}
				oHeaderType[i].className = 'headType_class';
				//切换选项后实时更新url	
				updateURL()
				requestArg.requestURL = requestURL;
				//input.value = '';
				oHeaderType[i].addEventListener('mousedown', function(e) {
					e.preventDefault();
				});; //切换选项不失去焦点
			});
		}

		function getTime(unixtime) {
			let date = new Date(unixtime * 1000);
			let str = (date.getMonth() + 1) + "月" + date.getDate() + "日";
			return str;
		};
		loading.style.display = 'block'; //启用加载动画
		input.blur();
		search_box.className = ''; //点击后隐藏自己,减少重复点击可能性.

		let nowCityName = e.data.name; //当前选中的城市名
		let nowCityXy = e.data.xy;
		requestArg.cityName = e.data.name;
		requestArg.xy = e.data.xy; //当前城市经纬度
		//排名与月均航班数量 / 数字动画
		let sumcity = new CountUp("chart8RankSum", 0, 3342, 0, 3.5, {
			useEasing: true,
			useGrouping: true,
			separator: ',',
			decimal: '.',
		});
		sumcity.start();
		let chart8FlightNum = new CountUp("chart8FlightNum", 0, Math.round(myData.allCityNum[nowCityName] / 3), 0, 3.5, {
			useEasing: true,
			useGrouping: true,
			separator: ',',
			decimal: '.',
		});
		chart8FlightNum.start();
		let arrCityNumRanking = Object.keys(myData.allCityNum);
		let chart8Ranking = new CountUp("chart8Ranking", 0, (arrCityNumRanking.indexOf(nowCityName)) + 1, 0, 3.5, {
			useEasing: true,
			useGrouping: true,
			separator: ',',
			decimal: '.',
		});
		chart8Ranking.start();
		let typingInfo = sys.getel('#typingInfo')[0];
		typingInfo.className = '';
		//														<code id="typingInfo" class="typing1">
		//						<i>2018年</i><i id="infoTime">3月24日  ~  2018年3月30日</i>，<span id="typingInfoCity">成都市</span>起降航班共<span id="infoNumFlights">924</span>架次。
		//						通往全球<span id="infoNumCitys">387</span>个城市，<span id="infoCountry">21</span>个国家和地区
		//					</code>
		sys.getel('#infoTime')[0].innerText = getTime(requestArg.startTime) + '~' + "2018年" + getTime(requestArg.endTime);
		sys.getel('#typingInfoCity')[0].innerText = e.data.name;
		//c1  c7    航班正常 延误 取消相关,state=a 请求的全部
		function funeveryDayflight(data) {
			location.hash = "#indexPage"; //请求完成 切换到主页面
			let cityLength = data.data.name.length; //城市数量(无重复)
			//热门航线 
			c1.setOption({
				title: {
					text: e.data.name + "航线繁荣度全览",
				},
				legend: {
					name: '出入港',
					selected: {
						'出港': true
					}
				},
				yAxis: {
					name: '城市名',
					data: data.data.name
				},
				series: [{
					name: "出港",
					data: data.data.value
				}, {
					name: '入港',
					data: []
				}]
			});

			//航线 与城市地理位置 数据
			//{name:arrKeyCity[i],value:city.data[arrKeyCity[i]]}
			let cityScatter = []; //各城市名称与 地理位置
			let cityLines = []; //当前城市 到各个城市航线
			//myData.allCity[];
			//出港
			//!! i是当前点击的城市 索引   ii是循环城市数量的
			let sumValue = 0 //所有出港总数
			for(let ii = 0; ii < cityLength; ii++) {
				cityScatter.push({
					name: data.data.name[ii],
					value: myData.allCity[data.data.name[ii]]
				});
				cityLines.push({
					fromName: nowCityName,
					toName: data.data.name[ii],
					coords: [nowCityXy, myData.allCity[data.data.name[ii]]],
					value: data.data.value[ii]
				});
				sumValue += data.data.value[ii];
			}
			//console.log(cityLines);//航线
			//显示该城市通往城市散点 高亮该城市  加载航线
			map.setOption({
				geo: {
					center: e.data.xy,
					zoom: 8
				},
				series: [{
						name: "城市",
						data: cityScatter
					},
					{
						name: "hightScatter",
						data: [{
							name: e.data.name,
							value: e.data.xy
						}]
					},
					{
						name: "航线",
						data: cityLines
					}
				]
			});
			//lines 加载 出问题? 服务器加载来的数据
			//城市名 Y轴间隔,解决过多的城市 名称拥挤
			console.log("通航城市数" + cityLength);
			c1.setOption({
				yAxis: {
					name: "城市名",
					axisLabel: {
						interval: 'auto'
					}
				}
			});
			c7.setOption({
				title: {
					text: e.data.name + '通航城市词云图'
				},
				series: {
					name: '城市词云',
					data: data.data.word
				}
			});
			//更新图例切换数据
			saveC1Data = c1.getOption().series[0].data;
			saveC1yAxis = c1.getOption().yAxis[0].data;
			saveMapScatter = map.getOption().series[2].data;
			saveMapLines = map.getOption().series[1].data;
			saveMapHightScatter = map.getOption().series[0].data;
			//更新大标题描述  出港总数 动画
			updateDesc('出港', sumValue, cityLength);

			//切换图例也更新url
			updateURL();
			//console.timeEnd("请求耗时");
			requestArg.outDesc = { //出港的描述  供切换图例为入港使用
				flights: sumValue,
				cityLength: cityLength
			};
			//console.log(requestArg.outDesc);

		} //函数结束
		indexDB.get(`everyDayflight` + `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}&state=a` + requestURL, function(data) {
			let DB = {
				data: data
			}
			console.log('everyDayflight:')
			//console.log(data);
			console.log("取自本地");

			funeveryDayflight(DB); //之前的函数存放的是data事件里的data,所以这里补一个上级对象.
			loading.style.display = 'none'; //关闭加载动画
			//lastTime.c1=c1.getOption();
			//console.log(lastTime.c1)
			//lastTime.map=map.getOption();
			//lastTime.c7=c7.getOption();
			//indexDB.set('lastTime', lastTime, function() {}, function() {});				
		}, function() {
			sys.worker('everyDayflight.js', {
				arg: `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}&state=a`,
				headerType: requestURL
			}, function(data) {
				funeveryDayflight(data);
				loading.style.display = 'none'; //关闭加载动画
				//存下来//不能直接存储data(或者argument[0]),因为这是事件,应该存储data.data
				indexDB.set(`everyDayflight` + `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}&state=a` + requestURL, arguments[0].data, function() {}, function() {});
			}); //sys.worker: 'everyDayflight.js'结束

		}); //indexdb结束

		//c5  时间轴 每日信息
		function funTimeline(flights) {
			let jsonFlights = JSON.parse(flights);
			//console.log(jsonFlights);
			//天数
			//let dayLength = jsonFlights.g.length;startTime
			//dayLength 有多少天
			let dayLength = (requestArg.endTime - requestArg.startTime) / 86400;
			//时间戳 需要转毫秒(毫秒 js才能取出时间)
			let startTime = new Date((requestArg.startTime) * 1000);
			let endTime = new Date((requestArg.endTime) * 1000);
			let month = startTime.getMonth() + 1;
			let startDate = startTime.getDate();
			let allSum = 0; //所有天航班总数
			//jsonFlights.a[0]
			let dayName = []; //每天的名称
			let options = []; //所有子项
			let delay = []; //延误航线
			let cancel = [];
			for(let i = 0; i < dayLength; i++) { //大循环  计算每天的日期  
				dayName.push(new Date(((requestArg.startTime + 86400 * i) * 1000)).getMonth() + 1 + "-" + new Date(((requestArg.startTime + 86400 * i) * 1000)).getDate());
				//jsonFlights.a[i];
				let asum = 0; //当天总数
				let gsum = 0;
				let ysum = 0;
				let rsum = 0;
				//每天城市数量不同  需要不同length  
				for(let cityNum = 0; cityNum < jsonFlights.g[i].length; cityNum++) {
					//第i天 所有城市的值						
					gsum += jsonFlights.g[i][cityNum][1];

					//console.log(gsum);
					// console.log("长度"+jsonFlights.a[i].length)
					//ysum += jsonFlights.y[i][cityNum][1];
					// rsum += jsonFlights.r[i][cityNum][1];
					// asum += gsum+ysum+rsum;
				}
				// a和 其他三个状态 城市数不同
				for(let cityNum = 0; cityNum < jsonFlights.y[i].length; cityNum++) {

					ysum += jsonFlights.y[i][cityNum][1];
					delay.push({
						fromName: e.data.name,
						toName: jsonFlights.y[i][cityNum][0],
						coords: [myData.allCity[e.data.name], myData.allCity[jsonFlights.y[i][cityNum][0]]],
						value: jsonFlights.y[i][cityNum][1]
					})

				}
				for(let cityNum = 0; cityNum < jsonFlights.r[i].length; cityNum++) {

					rsum += jsonFlights.r[i][cityNum][1];
					cancel.push({
						fromName: e.data.name,
						toName: jsonFlights.r[i][cityNum][0],
						coords: [myData.allCity[e.data.name], myData.allCity[jsonFlights.r[i][cityNum][0]]],
						value: jsonFlights.r[i][cityNum][1]
					});
				}
				asum = gsum + ysum + rsum;
				options.push({
					title: {
						text: new Date(((requestArg.startTime + 86400 * i) * 1000)).getMonth() + 1 + '月' + new Date(((requestArg.startTime + 86400 * i) * 1000)).getDate() + '日'
					},
					series: [{
							data: [asum, gsum, ysum, rsum]
						},
						{
							data: [{
									name: '正常',
									value: gsum
								},
								{
									name: '延误',
									value: ysum
								},
								{
									name: '取消',
									value: rsum
								}
							]
						}
					]
				}); //再清空,下一次继续循环  
				allSum += asum;
				asum = 0;
				gsum = 0;
				ysum = 0;
				rsum = 0;
			}
			map.setOption({
				series: [{
					name: '延误',
					data: delay
				}, {
					name: '取消',
					data: cancel
				}]
			});

			console.log(allSum); //所有天总数
			c5.setOption({
				baseOption: {
					title: {
						subtext: `${startTime.getMonth()+1}月${startTime.getDate()}日 ~ ${endTime.getMonth()+1}月${endTime.getDate()}日${e.data.name}每日航班概览`,
					},
					timeline: {
						currentIndex: 0,
						data: dayName
					}
				},
				options: options
			});
		} //funTimeline结束

		//航司规模 、准点率/juhe/out/zhundian
		function funAirline(airline) {
			let airlineData = JSON.parse(airline);
			//			console.log(airlineData);
			let arrAirlineData = [];
			let arrAirlineName = []; //航司名
			for(let i = 0; i < airlineData.length; i++) {
				arrAirlineData.push({
					type: 'parallel',
					name: airlineData[i].name,
					data: [ //运营航班总数 ,延误数,准点率,平均延误秒数
						[airlineData[i].all, airlineData[i].onTime, parseFloat((airlineData[i].percent).toFixed(3)) * 100, airlineData[i].avgDelay / 60]
					]
				});
				arrAirlineName.push(airlineData[i].name);
			}

			let airLineOption = {
				title: {
					x: 'center',
					text: '相关航司信息',
					textStyle: {
						fontSize: 14,
						color: 'rgba(0,245,255,0.7)'
					}
				},
				color: [
					'red', 'green', 'white', 'black', 'blue', 'yellow', '#d622ec', '#836FFF', '#fdffdb', '#49c1bf'
				],
				legend: {
					type: 'scroll',
					data: arrAirlineName,
					left: '85%',
					orient: 'vertical',
					selectedMode: 'multiple',
					textStyle: {
						color: 'rgba(0,245,255,1)',
						fontSize: 10,
					},
					inactiveColor: 'rgba(100,100,100,1)',
					tooltip: {
						show: true
					}
				},
				tooltip: {
					show: true,
					trigger: 'item',
					//formatter: "加油干"
				},
				realtime: false,

				parallelAxis: [{
						dim: 0,
						name: '经营规模'
					}, // 每个『坐标轴』有个 'dim' 属性，表示坐标轴的维度号。
					{
						dim: 1,
						name: '延误数'
					},
					{
						dim: 2,
						name: '准点率 %'
					},
					{
						dim: 3,
						name: '平均延迟(分)'
					},
				],
				parallel: { //坐标系																	
					left: 30,
					bottom: '9%',
					top: "10%",
					right: 85,
					width: 'auto',
					parallelAxisDefault: { // 『坐标轴』的公有属性可以配置在这里避免重复书写
						type: 'value',
						nameLocation: 'start',
						nameGap: 8,
						triggerEvent: true,
						nameTextStyle: {
							color: 'rgba(0,245,255,0.8)'
						},
						axisLine: {
							lineStyle: {
								color: 'rgba(0,245,255,0.8)',
								width: 2
							}
						},
						axisLabel: {

						}
					},

				},
				series: arrAirlineData
			};
			c2.clear();
			c2.setOption(airLineOption);
			//console.log(airlineData);
			//	console.log(arrAirlineData);
		}

		indexDB.get('/node/all/city' + `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, function(data) {
			funTimeline(data); //取值成功
			//记录当前请求,下次打开继续
			//lastTime.c5 = c5.getOption();
			//indexDB.set('lastTime', lastTime, function() {}, function() {});
			//alert('成功')
		}, function() { //取值为空
			sys.request('get', '/node/all/city', `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, function(flights) {
				funTimeline(flights);
				indexDB.set('/node/all/city' + `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, flights, function() {}, function() {});
				//lastTime.c5 = c5.getOption();
				//indexDB.set('lastTime', lastTime, function() {}, function() {});
				//alert('网络请求')
			});
		});
		indexDB.get('/node/out/zhundian' + `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, function(data) {
			funAirline(data);
			//lastTime.c2 = c2.getOption();
			//indexDB.set('lastTime', lastTime, function() {

			//}, function() {});
			//alert('本地')
		}, function() {
			sys.request('get', '/node/out/zhundian', `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, function(airline) {
				funAirline(airline);
				indexDB.set('/node/out/zhundian' + `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, airline, function() {}, function() {})
				//lastTime.c2 = c2.getOption();
				//indexDB.set('lastTime', lastTime, function() {

				//}, function() {});
				//alert('网络')
			}, function(err) {
				console.log("请求出错");
			});
		});

		//来往国家
		function funCountyName(countyName) {
			let jsonCountyName = JSON.parse(countyName);
			let arrCountyData = [];
			let arrCountyName = [];
			let countyLength = jsonCountyName.length;

			console.log("航线通往国家和地区数:" + countyLength);
			for(let i = 0; i < countyLength; i++) {
				arrCountyData.push({
					value: jsonCountyName[i][1],
					name: jsonCountyName[i][0]
				});
			}
			if(requestURL == "/node/out/city/home") {
				sys.getel("#infoCountry")[0].innerText = "。"
			} else {
				let infoCountry1 = new CountUp("infoCountry", 0, countyLength, 0, 3.5, {
					useEasing: true,
					useGrouping: true,
					separator: ',',
					decimal: '.',
				});
				infoCountry1.start();
			}

			arrCountyData.sort(function(a, b) {
				return b.value - a.value;
			});
			for(let c = 0; c < countyLength; c++) { //截取排序后的 国家名
				arrCountyName.push(arrCountyData[c].name);
			}
			//console.log(arrCountyName)
			//arrCountyName.push(jsonCountyName[i][0]);
			//截取前10
			let Top10arrCountyData = arrCountyData.splice(0, setUp.countryTop);
			let Top10arrCountyName = arrCountyName.splice(0, setUp.countryTop);

			//console.log(Top10arrCountyName);
			c3.setOption({
				title: {
					x: 'center',
					y: 0,
					textStyle: {
						fontSize: 14,
						color: 'rgba(0,245,255,0.7)'
					},
					text: e.data.name + "航班来往国家TOP榜"
				},
				legend: {
					name: '国家图例',
					data: Top10arrCountyName,
					selected: {
						'本国': false
					}
				},
				series: [{
					name: '来往国家',
					data: Top10arrCountyData
				}]
			});
			//通航小于等于两个国家,就显示本国
			if(countyLength <= 2) {
				c3.setOption({
					legend: {
						name: '国家图例',
						selected: {
							'本国': true
						}
					},
				})
			}
		}
		indexDB.get('/node/all/countyName' + `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, function(countyName) {
			funCountyName(countyName);
			//lastTime.c3 = c3.getOption();
			//indexDB.set('lastTime', lastTime, function() {

			//}, function() {});
			//alert('本地');
		}, function() {
			sys.request('get', '/node/all/countyName', `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, function(countyName) {
				funCountyName(countyName);
				indexDB.set('/node/all/countyName' + `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, countyName, function() {}, function() {});
				//lastTime.c3 = c3.getOption();
				//indexDB.set('lastTime', lastTime, function() {

				//}, function() {});
				//alert('网络');
			});
		});
		//天气或油耗
		function funWeatherOrOli(weatherData) {
			sys.request('get', '/node/weather', `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}&aa=1`, function(serverWeatherData) {
				let jsonData = JSON.parse(serverWeatherData);
				let hightTemp = [];//高温
				let lowTemp = [];//低温
				let keys = Object.keys(jsonData);//keys 是时间
				let keysTime =[];
				for(let i=0;i<keys.length;i++){
					hightTemp.push(jsonData[keys[i]].day[1]);
					lowTemp.push(jsonData[keys[i]].night[1]);
					keysTime.push(getTime(keys[i]));
				}
				console.log(hightTemp);
				console.log(lowTemp);
				//如果有天气数据就加载天气
				if(keys.length != 0) {
					c9.clear();
					c9.setOption({
						grid: {
							left: -5,
							right: 50,
							top: 50,
							bottom: 5,
							width: '91%',
							containLabel: true
						},
						title: {
							textStyle: {
								color: 'rgba(0,245,255,0.6)',
								fontSize: 14
							},
							x: 'center',
							text: e.data.name + '天气',
							subtext: getTime(requestArg.startTime) + '~' + getTime(requestArg.endTime)
						},
						tooltip: {
							trigger: 'axis',
							formatter: function(params) {
								let txt = '<p style=font-size:0.16rem>时间：' + params[0].name + '</p>'
								for(let all = 0; all < params.length; all++) {
									if(params[all].seriesName=='最高气温'){
										txt += `<div>${params[all].seriesName}：<span style='color:#FFA54F'>    ${params[all].data}℃</span><div>`
									}else if(params[all].seriesName=='最低气温'){
										txt += `<div>${params[all].seriesName}：<span style='color:#abf4fc'>    ${params[all].data}℃</span><div>`
									}
									
								}
								let index = params[0].dataIndex;//根据索引 自定义数据 进入tooltip
								
								txt+=`<p style='font-size:0.16rem'>白天：</p>
									<div>天气概述：${jsonData[keys[index]].day[0]}</div>
									<div>风向： ${jsonData[keys[index]].day[2]}，风力级别：${jsonData[keys[index]].day[3]}</div>
									<p style='font-size:0.16rem'>夜间：</p>
									<div>天气概述：${jsonData[keys[index]].night[0]}</div>
									<div>风向： ${jsonData[keys[index]].night[2]}，风力级别：${jsonData[keys[index]].night[3]}</div>`
								return txt;
							},
						},
						legend: {
							left: 5,
							selectedMode: 'multiple',
							textStyle: {
								color: 'rgba(0,245,255,1)',
								fontSize: 12,
							},
							inactiveColor: 'rgba(100,100,100,1)',
							tooltip: {
								show: true
							},
							data: ['最高气温', '最低气温']
						},
						toolbox: {
							show: true,
							feature: {
								dataZoom: {
				                	yAxisIndex: 'none',
				              },
								magicType: {
									type: ['line', 'bar']
								},
							},
						},
						xAxis: {
							interval: 'auto',
							type: 'category',
							boundaryGap: false,
							axisLabel: {
								rotate: 0,
								margin: 6,
								textStyle: {
									color: 'rgba(0,245,255,1)'
								}
							},
							axisLine: {
								show: true,
								lineStyle: {
									color: 'rgba(0,245,255,1)' //轴文字色取自这
								}
							},
							splitLine: {
								show: false,
							},
							data: keysTime
						},
						yAxis: {
							type: 'value',
							axisPointer:{
								label:{
									show:true
								}
							},
							axisLabel: {
								formatter: '{value} °C',
								textStyle: {
									color: 'rgba(0,245,255,1)'
								}
							},
							axisLine: {
								show: false,
								lineStyle: {
									color: 'rgba(0,245,255,1)' //轴文字色取自这
								}
							},
							splitLine: { //刻度轴线
								show: true,
								lineStyle: {
									color: 'rgba(0,245,255,0.2)'
								}
							},
						},
						series: [{
								name: '最高气温',
								type: 'line',
								itemStyle: {
									normal: {
										color: new echarts.graphic.LinearGradient(5, 1, 5, 0, [{
											offset: 1,
											color: '#FF3030'
										}, {
											offset: 0,
											color: '#FFA54F'
										}]),
									}
								},
								lineStyle: {
									normal: {
										width: 3
									}
								},
								data: hightTemp,
								markPoint: {
									symbol: 'pin',
									symbolSize: 35,
									data: [{
										type: 'max',
										name: '最大值'
									}]
								},
								markLine: {
									data: [{
										type: 'average',
										name: '平均值',
										label: {
											normal: {
												color: '#FFA54F',
												position: 'end',
												formatter: '平均值'
											}
										},
									}]
								}
							},
							{
								name: '最低气温',
								type: 'line',
								data: lowTemp,
								itemStyle: {
									normal: {
										color: new echarts.graphic.LinearGradient(5, 1, 5, 0, [{
											offset: 1,
											color: 'rgba(0,245,255,1)'
										}, {
											offset: 0,
											color: '#abf4fc'
										}])
									}
								},
								lineStyle: {
									normal: {
										width: 3
									}
								},
								markPoint: {
									symbol: 'pin',
									symbolSize: 35,
									data: [{
										type: 'min',
										name: '最大值'
									}]
								},
								markLine: {
									data: [{
										type: 'average',
										name: '平均值',
										label: {
											normal: {
												color: '#abf4fc',
												position: 'end',
												formatter: '平均值'
											}
										},
									}, ]
								}
							}
						]
					});
				} else {
					//城市某时间范围内总耗油
					sys.request('get', '/node/juhe/city/oli', `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, function(oli) {
						let jsonOli = JSON.parse(oli);
						c9.clear(); //又出问题  水球图必须先清空.
						let waveAnimation; //检查耗油动画开关
						if(setUp.oliAnimation) {
							waveAnimation = true;
						} else {
							waveAnimation = false;
						}
						c9.setOption({
							title: {
								text: ''
							},
							series: [{
								name: 'shuiqiu',
								type: 'liquidFill',
								waveAnimation: waveAnimation,
								amplitude: 11,
								//animationDuration:10,//静止 提高性能
								center: ['50%', '50%'],
								data: [0.6, 0.4],
								radius: '95%',
								rotate: 40,
								color: ['#564d12 ', '#a1a126 ', '#cdcd0e'],
								outline: {
									show: false
								},
								backgroundStyle: {
									borderColor: 'rgba(0,245,255,1)',
									borderWidth: 2,
									shadowColor: 'rgba(0,245,255, 0.4)',
									shadowBlur: 0
								},
								shape: 'path://M24 19.999l-5.713-5.713 13.713-10.286-4-4-17.141 6.858-5.397-5.397c-1.556-1.556-3.728-1.928-4.828-0.828s-0.727 3.273 0.828 4.828l5.396 5.396-6.858 17.143 4 4 10.287-13.715 5.713 5.713v7.999h4l2-6 6-2v-4l-7.999 0z',
								label: {
									align: 'center',
									normal: {
										align: 'center',
										formatter: function() {
											return `总耗油\n ${jsonOli[0]}加仑`;
										},
										textStyle: {
											align: 'center',
											fontSize: 20,
											color: '#D94854'
										}
									}
								}
							}]
						});

					});
					
				}
				//console.log(jsonData);
			});

		}
		funWeatherOrOli();
		//		indexDB.get('/node/getWeather'+ `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`,function(dbWeatherData){
		//			funWeatherOrOli(dbWeatherData);
		//		},function(){
		//			sys.request('get', '/node/getWeather', `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, function(serverWeatherData) {
		//				funWeatherOrOli(serverWeatherData);
		//				indexDB.set('/node/getWeather' + `city=${e.data.name}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}`, serverWeatherData, function() {}, function() {});
		//			});
		//		});

	} //importantCity函数结束
	//	记录上次(最后一次)的数据 url 下次打开继续
	//	默认值
	let lastTime = {
		data: {
			name: '成都市',
			xy: myData.allCity['成都市']
		},
	}
	//先取,如果为空再保存  //首次渲染默认值
	indexDB.get('lastTime', function(lastData) {
		importantCity(lastData);
	}, function() { //没有加载过,默认成都 ,加载过就取上次
		indexDB.set('lastTime', lastTime, function() {
			importantCity(lastTime);
		}, function() {});
	});

	//web worker  打开或切换为optionMapPage时才开始绘制散点
	sys.checkCoptionMapPage = function() {
		if(location.hash != "#optionMapPage") {
			optionMap.setOption({
				series: [{
					name: "城市",
					data: []
				}]
			});
		} else {
			//散点图的worker
			(function() {
				let workerScatter = new Worker("./js/webworker/scatter.js");
				workerScatter.postMessage(myData.allCity);
				workerScatter.onmessage = function(scatter) {
					//						map.appendData({
					//							seriesIndex: "2",
					//							data: scatter.data
					//						});
					//series[2].data = scatter.data;						
					//		series[3].data = convertData(item[1]);
					//map.setOption(option, false);
					//	optionMap.setOption(option)
					//								map.setOption({
					//									series: [{
					//											//name: "scatter",
					//											//data: scatter.data
					//									},									
					//									]
					//								});
					optionMap.setOption({
						title: {
							text: '通航城市全景',
							textStyle: {
								color: 'rgba(0,245,255,1)',
								fontSize: 16
							}
						},
						visualMap: {
							name: "散点",
							seriesIndex: 2, //只映射小散点
							type: 'continuous', //视觉 映射 连续型
							min: 0,
							max: 30000,
							text: ['繁忙', ''],
							realtime: false, //如果为ture则拖拽手柄过程中实时更新图表视图。false 结束后更新
							calculable: true, //是否显示拖拽用的手柄(最大和最小)								
							inRange: { //手柄样式  (绿  黄  红)
								color: ['#00FF7F', '#7FFF00', '#FFF68F', '#FFFF00', '#e89592', 'red'], //由小到大
								symbolSize: [5, 15]
							},
							textStyle: {
								color: 'rgba(0,245,255,1)'
							},
							dimension: 2
						},
						series: [{
							name: "城市",
							data: scatter.data
						}, ]
					});
					//console.log(optionMap.getOption());			
				}
			})();
		}
	};
	sys.checkCoptionMapPage(); //载入页面检测是否绘制全景散点
	window.addEventListener("hashchange", function(e) {
		sys.checkCoptionMapPage(); //hash改变也检测
	}, false);

	function updateDesc(type, argflights, argcityNum) { //更新顶部文字描述					
		let typingInfo = sys.getel('#typingInfo')[0];
		typingInfo.className = 'typing1'; //重绘动画

		let cityNum = new CountUp("infoNumCitys", 0, argcityNum, 0, 3, {
			useEasing: true,
			useGrouping: true,
			separator: ',',
			decimal: '.',
		});
		let infoNumFlights = new CountUp("infoNumFlights", 0, argflights, 0, 3, {
			useEasing: true,
			useGrouping: true,
			separator: ',',
			decimal: '.',
		});
		let infoType = sys.getel("#infoType")[0];
		let infoHome_country = sys.getel("#infoHome_country")[0];
		let info_moText = sys.getel("#info_moText")[0];
		setTimeout(function() {
			infoNumFlights.start();
			cityNum.start();
		}, 2200);
		if(type == "入港") {
			switch(requestArg.requestURL) {
				case '/node/out/city':
					infoType.innerText = "入港航班共";
					infoHome_country.innerText = "来自全球";
					info_moText.style.display = 'inline';;
					break;
				case '/node/out/city/home':
					infoType.innerText = "国内入港航班共";
					infoHome_country.innerText = "来自全国";
					info_moText.style.display = 'none';
					break;
				case '/node/out/city/county':
					infoType.innerText = "国际入港航班共";
					infoHome_country.innerText = "来自全球";
					info_moText.style.display = 'inline';
					break;
				default:
					infoType.innerText = "入港航班共";
					infoHome_country.innerText = "来自全球";
					info_moText.style.display = 'inline';
					break;
			}
		} else {
			switch(requestArg.requestURL) {
				case '/node/out/city':
					infoType.innerText = "出港航班共";
					infoHome_country.innerText = "通往全球";
					info_moText.style.display = 'inline';;
					break;
				case '/node/out/city/home':
					infoType.innerText = "国内出港航班共";
					infoHome_country.innerText = "通往全国";
					info_moText.style.display = 'none';
					break;
				case '/node/out/city/county':
					infoType.innerText = "国际出港航班共";
					infoHome_country.innerText = "通往全球";
					info_moText.style.display = 'inline';
					break;
				default:
					infoType.innerText = "出港航班共";
					infoHome_country.innerText = "通往全球";
					info_moText.style.display = 'inline';
					break;
			}
		}

	}
	//搜索框 搜索处理
	(function() {
		//					let lastTime = {
		//									cityName:,
		//									start:requestArg.startTime,
		//									end:requestArg.endTime
		//								}
		let input = sys.getel("#searchInput")[0];
		let warn = sys.getel("#search_result_box i")[0]; //首行的提醒
		let inputValue; //处理后的value
		let search_result_box = sys.getel("#search_result_box")[0];
		let timer = null;
		let timer2 = null;
		let oHeaderType = sys.getel("#headType div");
		let requestURL = ''; //全部,国内,国际				
		let headClassName = 'headType_class';
		let search_box = sys.getel("#search")[0]; //搜索单 
		search_box.addEventListener('mousedown', function(e) {
			//e.preventDefault();//不失去焦点
			e.stopPropagation();
		});
		let loading = sys.getel("#loading")[0];
		sys.getel('#headType')[0].addEventListener('mousedown', function(e) {
			e.preventDefault(); //输入框不失去焦点
		});
		let updateURL = function() { //更新出入港url
			if(oHeaderType[0].className == headClassName) {
				requestURL = "/node/out/city";
			} else if(oHeaderType[1].className == headClassName) {
				requestURL = "/node/out/city/home";
			} else {
				requestURL = "/node/out/city/county";
			}
		};
		updateURL();

		//					成都 默认值 全部的,  航班数 城市数 updateDesc('出港',);
		for(let i = 0; i < oHeaderType.length; i++) { //先把所有清空  给当前点击的添加class
			oHeaderType[i].addEventListener('click', function(e) {
				for(let ii = 0; ii < oHeaderType.length; ii++) {
					oHeaderType[ii].className = '';
				}
				oHeaderType[i].className = 'headType_class';
				//切换选项后实时更新url	
				updateURL()
				requestArg.requestURL = requestURL;
				//input.value = '';
				oHeaderType[i].addEventListener('mousedown', function(e) {
					e.preventDefault();
				});; //切换选项不失去焦点
			});
		}
		//监听input value值变化	
		loading.style.display = 'none'; //window.onload完毕 关闭加载动画
		input.oninput = function() {
			updateURL();
			console.log(requestURL)
			requestArg.requestURL = requestURL;
			console.log(requestArg.type);
			//使用正则过滤特殊字符
			//let re = /[>_<(?~？！){。}、%&$^@!=+-`",.:]/gm; // =和-之间多了个+号???就匹配不到数字
			let re = /[>_<\(?~？！\){。}、%&\$@!=\-,.\+\*]/gm; //不去掉空格
			inputValue = this.value.replace(re, "");
			if(re.test(this.value)) { //检验是否包含特殊字符
				warn.innerHTML = "星云已为您过滤特殊字符";
			}
			//console.log(inputValue);
			if(inputValue) {

				clearTimeout(timer);
				timer = setTimeout(function() { //防止用户输入太快  降低服务器、计算压力 每次输入变动 都清除上一个定时器再开启新的定时器,除非700ms后
					let posObj = {
						inputValue: inputValue,
						allCity: myData.allCity
					}
					if(requestArg.type == "城市名") {
						sys.worker("search.js", posObj, function(e) { //src  sendData  callback(传回数据)
							//let dataLength = e.data.length;
							let oldDiv = sys.getel("#search_result_box div");
							for(let i = 0; i < oldDiv.length; i++) { //添加数据到页面前 先清空之前数据							
								search_result_box.removeChild(oldDiv[i]);
							}
							if(Array.isArray(e.data.name) && Array.isArray(e.data.xy)) {
								let dataLength = e.data.name.length;
								if(e.data.name.length == 0) { //如果是数组 且为0,查询为空
									warn.innerHTML = "没有查询到结果,请尝试减少关键词";
								} else { //添加数据到页面  生成div  并且填充相应数据 点击自身添加到列表 点击
									warn.innerHTML = "星云为您找到如下城市:";

									for(let i = 0; i < dataLength; i++) {
										//<span class="fa fa-map-marker"></span>
										let div = doc.createElement("div");
										let span = doc.createElement("span");
										span.className = "fa fa-map-marker";
										div.innerText = e.data.name[i];
										search_result_box.appendChild(div);
										div.addEventListener('click', function() { //把web worker计算结果循环 渲染到待选区,点击的第几个div/span 也能获取相应信息
											//最重要的数据交互函数
											let importantCityData = {
												data: {
													name: e.data.name[i],
													xy: e.data.xy[i]
												},
											}
											importantCity(importantCityData);
										}); //div 点击事件结束
										div.appendChild(span);
										//定位功能  不同页面使用不同地图进行定位
										span.addEventListener('click', function(event) {
											event.stopPropagation(); //不冒泡  防止点击定位事件冒泡到div 也发生数据请求
											if(location.hash == "#indexPage") {
												map.setOption({
													geo: {
														center: e.data.xy[i],
														zoom: 15
													},
													tooltip: {
														trigger: 'item',
														formatter: function(params) {
															let returnValue = "空";
															if(location.hash == "#indexPage") {
																if(params.seriesType == "scatter" || params.seriesType == "effectScatter") {
																	return params.name;
																} else if(params.seriesType == "lines") {
																	return params.data.fromName + '>' + params.data.toName + "</br>" + "航班数:" + params.data.value + "架次";
																}
															} else {
																if(params.seriesType == "scatter" || params.seriesType == "effectScatter") {
																	if(params.value[2]) { //如果有值

																		return params.name + "</br>月均起降:" + params.value[2] + "架次";
																	} else {
																		console.log(params.value[2])
																		return params.name + "</br>月均起降:" + '暂无数据';
																	}

																} else if(params.seriesType == "lines") {
																	return params.data.fromName + '>' + params.data.toName + "</br>" + "航班数:" + params.data.value + "架次";
																}
															}

														}
													},
													series: [{ //定位后的value 把月均加上去,之前月均只有散点有
														name: "hightScatter",
														data: map.getOption().series[0].data.concat({
															name: e.data.name[i],
															value: e.data.xy[i].concat(Math.round(myData.allCityNum[e.data.name[i]] / 3))
														})
													}]
												}, false);
												//map.setOption(option);
											} else if(location.hash == "#optionMapPage") {
												optionMap.setOption({
													geo: {
														center: e.data.xy[i],
														zoom: 12
													},
													series: [{
														name: "hightScatter",
														data: optionMap.getOption().series[0].data.concat({
															name: e.data.name[i],
															value: e.data.xy[i].concat(Math.round(myData.allCityNum[e.data.name[i]] / 3))
														})
													}]
												}, false);
											}
										});
									}
								}
							}

						});
					} else if(requestArg.type == "国家名") {
						
					} else if(requestArg.type == "航班号") {

						let oldDiv = sys.getel("#search_result_box div");
						for(let i = 0; i < oldDiv.length; i++) { //添加数据到页面前 先清空之前数据							
							search_result_box.removeChild(oldDiv[i]);
						}
						clearTimeout(timer2);
						//延迟请求 降低压力
						timer2 = setTimeout(function() {
							let oldDiv = sys.getel("#search_result_box div");
							for(let i = 0; i < oldDiv.length; i++) { //添加数据到页面前 先清空之前数据							
								search_result_box.removeChild(oldDiv[i]);
							}
							sys.request('get', '/node/indent', `ident=${inputValue}&time=${requestArg.singleTime}`, function(indentInfo) {
								//alert(requestArg.singleTime); 航班项时间
								warn.innerHTML = "星云为您找到如下航班号";
								let jsonIndentInfo = JSON.parse(indentInfo);
								if(jsonIndentInfo.length == 0) {
									warn.innerHTML = "星云未找到该航班号,当天该航班可能未起飞";
								} else {
									function getTime(unixtime) {
										let date = new Date(unixtime * 1000);
										let str = (date.getMonth() + 1) + "月" + date.getDate() + "日" + date.getHours() + "时" + date.getMinutes() + "分";
										return str;
									};
									for(let i = 0; i < jsonIndentInfo.length; i++) {
										let div = doc.createElement("div");
										let code = doc.createElement("code");
										code.innerText = `${jsonIndentInfo[i][1].substr(0,8)} → ${jsonIndentInfo[i][2].substr(0,8)}`;
										div.innerText = jsonIndentInfo[i][0];
										search_result_box.appendChild(div);
										div.appendChild(code);
										//最详细的信息
										div.addEventListener('click', function() {
											if(sys.getel('.secondPageAnimationClose')[0]) { //如果处于关闭状态 就点击一下.
												sys.getel('[tool=switch]')[0].click();
											}
											location.hash = "indexPage";
											//隐藏搜索
											search_box.className = '';
											sys.request('get', '/node/indent/info', `ident=${jsonIndentInfo[i][0]}&time=${requestArg.singleTime}`, function(IdentData) {
												//详细信息
												let jsonIndentDeta = JSON.parse(IdentData);
												let jsonIndentDetaLength = jsonIndentDeta.length;
												console.log(jsonIndentDeta);
												//倒三角布局数组
												let uiValue = [
													[5, 70],
													[35, 70],
													[65, 70],
													[95, 70],
													[20, 50],
													[50, 50],
													[80, 50],
													[35, 30],
													[65, 30],
													[50, 10]
												];
												let scatterColor = ['rgba(0,245,255,1)', '#FA8BFF', '#2BD2FF', '#a2e1d4', '#2ae0c8', '#2BFF88', '#FF6A88', '#9FACE6', '#bd03d4', '#e3c887'];
												let scatter10 = [
													getTime(jsonIndentDeta.offPlan) + '\n 计划起飞',
													getTime(jsonIndentDeta.offActual) + '\n 实际起飞',
													getTime(jsonIndentDeta.landPlan) + '\n 计划到达',
													getTime(jsonIndentDeta.landActual) + '\n 实际到达',
													jsonIndentDeta.lineDistance + '海里' + '\n 直线距离',
													jsonIndentDeta.distanceActual + '海里' + '\n 飞行距离',
													jsonIndentDeta.speed + '\n 飞行均速(节)',
													jsonIndentDeta.companyName + '\n 航司名',
													jsonIndentDeta.flightType + '\n 飞机型号',
													jsonIndentDeta.oil + "加仑" + '\n 耗油量',
												] //计算后的信息
												let oSpanCity = sys.getel("#secondCityName span"); //第一个span 起飞地  第二个降落地
												let oSpanairport = sys.getel("#secondFlyName span"); //机场名
												oSpanCity[0].innerText = jsonIndentDeta.startCity;
												oSpanCity[1].innerText = jsonIndentDeta.endCity;
												oSpanairport[0].innerText = jsonIndentDeta.startAirport.substr(0, 10) + '...';
												oSpanairport[0].title = jsonIndentDeta.startAirport;
												oSpanairport[1].innerText = jsonIndentDeta.endAirport.substr(0, 10) + '...';
												oSpanairport[1].title = jsonIndentDeta.endAirport;
												let oIarrow = sys.getel("#secondCityName i")[0]; //箭头
												switch(jsonIndentDeta.state) { //不同状态箭头颜色不同
													case '正常':
														oIarrow.style.color = "#02ee02";
														oIarrow.title = "正常";
														break;
													case '晚点':
														oIarrow.style.color = "yellow";
														oIarrow.title = "晚点";
														break;
													default:
														oIarrow.style.color = "red";
														oIarrow.title = "该航班已取消";
														break;
												}
												let uiNameType = [];
												let arrSingleIdentData = [];
												for(let i = 0; i < 10; i++) {
													arrSingleIdentData.push({
														name: scatter10[i],
														value: uiValue[i],
														itemStyle: {
															normal: {
																color: scatterColor[i]
															}
														}
													})
												}

												secondXy.setOption({
													series: [{
														name: '航班详细信息',
														data: arrSingleIdentData,
													}]
												}); //setOption
											});
										});
									}
								}
							});
						}, 100);

					} else {
						console.error("没有正确的选择的类型");
					}
				}, 100);
			} else {
				warn.innerHTML = "不知道搜索什么?请告诉星云哦!";
			}

		}
	})();
	//切换入港出港

	let saveC1Data = c1.getOption().series[0].data;
	let saveC1yAxis = c1.getOption().yAxis[0].data;
	let saveMapScatter = map.getOption().series[2].data;
	let saveMapLines = map.getOption().series[1].data;
	let saveMapHightScatter = map.getOption().series[0].data;
	let typingInfo = sys.getel('#typingInfo')[0];
	let loading = sys.getel("#loading")[0];
	c1.on('legendselectchanged', function(params) {
		loading.style.display = 'block';
		typingInfo.className = '';
		if(params.name == "入港" && params.selected['入港']) {
			console.log('点击了入港且入港为true');
			//let saveWord = 
			let requestInURL = ''; //入港数据地址 
			console.log('原来的请求地址' + requestArg.requestURL);
			switch(requestArg.requestURL) { //把出港对应的入港URL罗列转换
				case '/node/out/city':
					requestInURL = '/node/in/city';
					break;
				case '/node/out/city/home':
					requestInURL = '/node/in/city/home';
					break;
				case '/node/out/city/county':
					requestInURL = '/node/in/city/county';
					break;
				default:
					requestInURL = '/node/in/city';
					break;
			}
			//console.log("点击图例请求的地址:" + requestInURL);
			function inEveryDayflight(data) {
				let arrscatterInCity = [];
				let cityLength = data.data.name.length;
				let cityLines = [];
				let inFlights = 0; //入港航班数量
				for(let i = 0; i < cityLength; i++) {
					arrscatterInCity.push({
						name: data.data.name[i],
						value: myData.allCity[data.data.name[i]]
					});
					cityLines.push({
						fromName: data.data.name[i],
						toName: requestArg.cityName,
						coords: [myData.allCity[data.data.name[i]], myData.allCity[requestArg.cityName]],
						value: data.data.value[i]
					});
					inFlights += data.data.value[i];
				}
				c1.setOption({
					yAxis: {
						name: '城市名',
						data: data.data.name
					},
					series: [{
						name: "出港",
						data: []
					}, {
						name: '入港',
						data: data.data.value
					}]
				});
				map.setOption({
					geo: {
						center: myData.allCity[requestArg.cityName],
						zoom: 8
					},
					series: [{
							name: "城市",
							data: arrscatterInCity
						},
						{
							name: "hightScatter",
							data: [{
								name: requestArg.cityName,
								value: myData.allCity[requestArg.cityName]
							}]
						},
						{
							name: "航线",
							data: cityLines
						}
					]
				});
				updateDesc('入港', inFlights, cityLength); //更新文字描述
				loading.style.display = 'none'; //隐藏动画
			}; //inEveryDayflight结束
			indexDB.get('everyDayflight' + `city=${requestArg.cityName}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}&state=a` + requestInURL, function(data) {
				let DB = {
					data: data
				}
				inEveryDayflight(DB); //给他上级对象,因为data.data;
				//							lastTime.everyDay = 'everyDayflight' + `city=${requestArg.cityName}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}&state=a` + requestInURL;
				//								indexDB.set('lastTime', lastTime, function() {
				//					
				//								}, function() {});
				//alert('本地');
			}, function() {
				sys.worker('everyDayflight.js', { //这个worker 负责把数据序列化 实现去重/重复合并,数组key value对应
					arg: `city=${requestArg.cityName}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}&state=a`,
					headerType: requestInURL
				}, function(data) {
					inEveryDayflight(data);
					indexDB.set('everyDayflight' + `city=${requestArg.cityName}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}&state=a` + requestInURL, data.data, function() {}, function() {});
					//lastTime.everyDay = 'everyDayflight' + `city=${requestArg.cityName}&timeStart=${requestArg.startTime}&timeEnd=${requestArg.endTime}&state=a` + requestInURL;
					//indexDB.set('lastTime', lastTime, function() {

					//}, function() {});
					//alert('网络');
				});
			});
			//eles  恢复出港数据
		} else if(params.name == "出港" && params.selected['出港']) {
			c1.setOption({
				yAxis: {
					name: '城市名',
					data: saveC1yAxis
				},
				series: [{
					name: "出港",
					data: saveC1Data
				}, {
					name: '入港',
					data: []
				}]
			});
			map.setOption({
				geo: {
					center: myData.allCity[requestArg.cityName],
					zoom: 8
				},
				series: [{
						name: "城市",
						data: saveMapScatter
					},
					{
						name: "hightScatter",
						data: [{
							name: requestArg.cityName,
							value: myData.allCity[requestArg.cityName]
						}]
					},
					{
						name: "航线",
						data: saveMapLines
					}
				]
			});
			//把更新描述  (还原),将保存起来的requestArg.outDesc设置						
			typingInfo.className = ''; //使用定时器  强制异步  否则点击后执行太快  动画消失
			setTimeout(function() {
				updateDesc('出港', requestArg.outDesc.flights, requestArg.outDesc.cityLength);
			}, 100)
			loading.style.display = 'none'; //隐藏动画
		}
	});
	//secondPage 配置项
	(function() {
		var data = [10, 45, 0, 25, 13, 1, 10, 5];
		var timeName = [];
		for(var i = 0; i < 8; i++) {
			//						data.push({
			//							value: Math.random() * 10 + 10 - Math.abs(i - 12),
			//							name: i + ':00'
			//						});
			timeName.push({
				name: i * 3 + ':00~' + parseInt(i * 3 + 3) + ":00",
				value: data[i],
			});
		}

		let secondOption = {
			title: {
				text: '分时',
				x: 'center',
				y: 'center',
				textStyle: {
					fontWeight: 'normal',
					fontSize: 20,
					color: "rgba(0,245,255,1)"
				}
			},
			tooltip: {
				trigger: 'item',
				formatter: "{b} : {c} <br/>({d}%)"
			},
			visualMap: {
				type: "continuous",
				show: true,
				min: Math.min.apply(null, data),
				max: Math.max.apply(null, data),
				inRange: {
					color: ["rgba(0,250,154,1)", 'rgba(255,255,0,0.3)', 'rgba(255,255,0,0.5)', 'rgba(255,64,64,0.5)']
				},
				dimension: 0 ////映射数组列 
			},
			color: ['rgba(0,245,255,1)'],
			series: [{
				type: 'pie',
				data: timeName,
				radius: ['70%', '99%'],
				zlevel: 1,
				itemStyle: {
					normal: {
						color: 'rgba(0,255,245,1)',
						borderColor: 'white'
					}
				},
				label: {
					show: true,
					normal: {
						position: 'inside',
						color: "rgba(0,245,255,1)"
					}
				},
				labelLine: {
					show: false
				},

			}]
		};
		//副页图
		//let cSecondPagePie = echarts.init(sys.getel("#secondPagePie")[0]); //condPagePie实例
		//cSecondPagePie.setOption(secondOption);

	})();
	//窗口改变时 响应   备注:echarts过于卡顿  已注释
	//						function resize(){
	//								let Example = [c1, c2, c3, map, c5, c7,c9];//图表实例集合
	//								let ExampleLength =Example.length ;
	//								let fontSize = (innerWidth / 1536 * 0.625) * 10;
	//								window.onresize = function() {
	//									fontSize = (innerWidth / 1536 * 0.625) * 10;
	//									document.documentElement.style.fontSize = fontSize + "rem";
	//									//optionMap.resize();
	//				//					for(let i=0;i<ExampleLength;i++){
	//				//						Example[i].resize();
	//				//					}
	//								}
	//							}
	//							resize();
	(function() {
		let btnCity = sys.getel('[tool=optionCity]')[0];
		let btnCounty = sys.getel('[tool=optionCounty]')[0];
		let btnAllEye = sys.getel('[tool=optionEye]')[0]; //全景  眼睛
		btnCity.addEventListener('click', function(e) {
			layui.use('layer', function() {
				var layer = layui.layer;
				layer.msg('请选择两个城市,查看其航线', {
					skin: 'optionMsg',
					icon: 7,
					time: 2000,
				});
			});
			btnCounty.style.cssText = '';
			btnCity.setAttribute('checked', true);
			btnCounty.setAttribute('checked', false);
			btnAllEye.style.cssText = '';
			this.style.cssText = "color:rgba(0,245,255,1);border: 0.02rem solid rgba(0,245,255,1);";
			optionMap.setOption({
				legend: {
					name: '城市',
					selected: {
						'城市': true
					}
				}
			});
			e.stopPropagation();
		});
		btnCounty.addEventListener('click', function(e) {
			//checkColor.apply(this,[]);
			btnCity.style.cssText = '';
			layui.use('layer', function() {
				var layer = layui.layer;
				layer.msg('请选择两个国家,查看两国所有航线', {
					skin: 'optionMsg',
					icon: 7,
					time: 2000,
					//									offset: 'rt'
				});
			});

			optionMap.setOption({
				legend: {
					name: '城市',
					selected: {
						'城市': false
					}
				}
			});
			btnAllEye.style.cssText = '';
			btnCity.setAttribute('checked', false);
			btnCounty.setAttribute('checked', true);
			this.style.cssText = "color:rgba(0,245,255,0.8);border: 0.02rem solid rgba(0,245,255,0.8);";
			e.stopPropagation();
		});
		btnAllEye.addEventListener('click', function(e) {
			//清空航线:
			optionMap.setOption({
				series: [{
					name: '航线',
					data: []
				}]
			});
			btnCity.style.cssText = '';
			btnCounty.style.cssText = '';
			btnCity.setAttribute('checked', false);
			btnCounty.setAttribute('checked', false);
			optionMap.setOption({
				legend: {
					name: '城市',
					selected: {
						'城市': true
					}
				}
			});
			this.style.cssText = "color:rgba(0,245,255,0.8);border: 0.02rem solid rgba(0,245,255,0.8);";
			e.stopPropagation();
		});
		let arrCounty = []; //存放两个国家
		let arrCity = []; //存放两个城市
		optionMap.on('click', function(params) {
			let state = function() {
				if(btnCity.getAttribute('checked') == 'true') {
					return 'btnCity'
				} else if(btnCounty.getAttribute('checked') == 'true') {
					return 'btnCounty'
				} else {
					return ''
				}
			}
			if(state() == "btnCounty" && params.componentType == "geo") {
				if(params.name == 'Korea') { //修复两个国家
					params.name = 'South Korea';
				} else if(params.name == 'Dem. Rep. Korea') {
					params.name = 'North Korea';
				}
				arrCounty.push(params.name);
				layui.use('layer', function() {
					let layer = layui.layer;
					layer.msg('您选择了' + arrCounty[0] + ',请继续选择', {
						skin: 'optionMsg',
						icon: 7,
						time: 3500,
						offset: 'rt'
					});
				});
				console.log(arrCounty);
				if(arrCounty.length == 2) {
					if(arrCounty[0] == arrCounty[1]) {
						arrCounty.pop(); //加载美国国内全部航线   内存占用超过1g...
						layui.use('layer', function() {
							var layer = layui.layer;
							layer.msg('请勿重复选择', {
								skin: 'optionMsg',
								icon: 7,
								time: 1500,
							});
						})
					} else {
						layui.use('layer', function() {
							var layer = layui.layer;
							layer.msg(arrCounty[0] + '与' + arrCounty[1] + '的航线加载中,请稍后', {
								skin: 'optionMsg',
								icon: 7,
								time: 2000,
							});
						});
						//											lines格式					{
						//																	fromName: nowCityName,
						//																	toName: data.data.name[ii],
						//																	coords: [nowCityXy, myData.allCity[data.data.name[ii]]],
						//																	value: data.data.value[ii]
						//																}
						sys.request('get', '/node/twoCountry', `fromCountry=${arrCounty[0]}&toCountry=${arrCounty[1]}`, function(countyLineData) {
							let jsonData = JSON.parse(countyLineData);
							let linesData = [];
							let arrFrom_cityName = Object.keys(jsonData);
							for(let i = 0; i < arrFrom_cityName.length; i++) { //先循环起飞城市 ,再循环起飞城市中每个城市所到达城市城市数,//取到json里每个城市 与其对应到达城市的数组,先得到两个对应的城市名,再通过城市名在myData.allCity中通过城市名取经纬度
								for(let ii = 0; ii < jsonData[arrFrom_cityName[i]].length; ii++) {
									linesData.push({
										fromName: arrFrom_cityName[i],
										toName: jsonData[arrFrom_cityName[i]][ii],
										coords: [myData.allCity[arrFrom_cityName[i]], myData.allCity[jsonData[arrFrom_cityName[i]][ii]]]
									});
								}
							}
							if(arrFrom_cityName.length == 0) {
								layui.use('layer', function() {
									let layer = layui.layer;
									layer.msg(arrCounty[0] + '与' + arrCounty[1] + '没有航线', {
										skin: 'optionMsg',
										icon: 2,
										time: 2500,
										//													offset: 'rt'
									});
								});
							} else {
								layui.use('layer', function() {
									let layer = layui.layer;
									layer.msg(arrCounty[0] + '与' + arrCounty[1] + '航线加载完成', {
										skin: 'optionMsg',
										icon: 1,
										time: 2000,
									});
								});
							}
							console.log()
							optionMap.setOption({
								series: [{
									name: '航线',
									zlevel: 1,
									animation: false,
									blendMode: "lighter", //线条叠加越多的区域越亮
									polyline: false, //开启多线段
									large: true, //是否优化
									largeThreshold: 5000, //优化阈值
									symbol: 'none',
									symbolSize: 6,
									effect: {
										show: false,
										period: 10,
										trailLength: 0,
										symbol: false,
										symbolSize: 10,
										color: "rgba(0,245,255,1)"
									},
									data: linesData
								}]
							});

							arrCounty = []; //加载完后,清空数组
						}); //request回调

					}

				} //下面是两个城市
			} else if(state() == "btnCity" && params.componentSubType == "scatter" || state() == "btnCity" && params.componentSubType == 'effectScatter') {
				arrCity.push(params.name);
				layui.use('layer', function() {
					let layer = layui.layer;
					layer.msg('您选择了' + arrCity[0] + ',请继续选择', {
						skin: 'optionMsg',
						icon: 7,
						time: 3500,
						offset: 'rt'
					});
				});
				console.log(arrCounty);
				if(arrCity.length == 2) {
					if(arrCity[0] == arrCity[1]) {
						arrCity.pop();
						layui.use('layer', function() {
							let layer = layui.layer;
							layer.msg('请勿重复选择', {
								skin: 'optionMsg',
								icon: 7,
								time: 1500,
							});
						})
					} else { //不重复,请求加载
						layui.use('layer', function() {
							var layer = layui.layer;
							layer.msg(arrCity[0] + '与' + arrCity[1] + '两个城市的通航信息加载中,请稍后', {
								skin: 'optionMsg',
								icon: 7,
								time: 2000,
							});
						});
						sys.request("get", '/node/list', `fromName=${arrCity[0]}&toName=${arrCity[1]}&time=${requestArg.singleTime}`, function(identList) {
							let jsonList = JSON.parse(identList);
							console.log(jsonList);
							if(jsonList.length == 0) {
								layui.use('layer', function() {
									let layer = layui.layer;
									layer.msg(arrCity[0] + '与' + arrCity[1] + '当日没有通航,CTRL+F 航班号中可修改日期', {
										skin: 'optionMsg',
										icon: 2,
										time: 2500,
									});
								});
							} else {
								let dataTable = `
											<div class='table_head'>
											<span>航班号</span>
											<span>起飞机场</span>
											<span>计划起飞</span>
											<span>计划到达</span>
											<span>降落机场</span>
											</div>`;

								function getTime(unixtime) {
									let date = new Date(unixtime * 1000);
									let str = (date.getMonth() + 1) + "月" + date.getDate() + "日" + date.getHours() + "时" + date.getMinutes() + "分";
									return str;
								};

								function subTex(str) {
									return str.substr(0, 10) + "..."
								}
								for(let i = 0; i < jsonList.length; i++) {
									dataTable += `
											<div class='table_rows'>
												<span class='table_ident'>${jsonList[i].ident}</span>
												<span class="table_startAirport">${subTex(jsonList[i].startAirportName)}</span>
												<span class="table_planFei">${getTime(jsonList[i].offPlan)}</span>
												<span class="table_planLan">${getTime(jsonList[i].landPlan)}</span>
												<span class="table_endAirport">${subTex(jsonList[i].endAirportName)}</span>
											</div>`
								}

								layui.use('layer', function() {
									let layer = layui.layer;
									layer.open({
										type: 1,
										title: '航班信息略表',
										skin: 'layui-layer-rim', //加上边框
										area: ['10rem', '6rem'], //宽高
										shadeClose: true,
										content: dataTable
									});

									let oRows = sys.getel('.table_rows');
									for(let i = 0; i < oRows.length; i++) {
										oRows[i].addEventListener('click', function() {
											//alert(oRows[i])
											//自动打开页面
											let indentArg = oRows[i].getElementsByClassName('table_ident')[0]; //ident参数
											if(sys.getel('.secondPageAnimationClose')[0]) { //如果处于关闭状态 就点击一下.
												sys.getel('[tool=switch]')[0].click();
											}
											location.hash = "indexPage";
											sys.request('get', '/node/indent/info', `ident=${indentArg.innerText}&time=${requestArg.singleTime}`, function(IdentData) {
												//详细信息
												let jsonIndentDeta = JSON.parse(IdentData);
												let jsonIndentDetaLength = jsonIndentDeta.length;
												console.log(jsonIndentDeta);
												let uiValue = [
													[5, 70],
													[35, 70],
													[65, 70],
													[95, 70],
													[20, 50],
													[50, 50],
													[80, 50],
													[35, 30],
													[65, 30],
													[50, 10]
												];
												let scatterColor = ['rgba(0,245,255,1)', '#FA8BFF', '#2BD2FF', '#a2e1d4', '#2ae0c8', '#2BFF88', '#FF6A88', '#9FACE6', '#bd03d4', '#e3c887'];
												let scatter10 = [
													getTime(jsonIndentDeta.offPlan) + '\n 计划起飞',
													getTime(jsonIndentDeta.offActual) + '\n 实际起飞',
													getTime(jsonIndentDeta.landPlan) + '\n 计划到达',
													getTime(jsonIndentDeta.landActual) + '\n 实际到达',
													jsonIndentDeta.lineDistance + '海里' + '\n 直线距离',
													jsonIndentDeta.distanceActual + '海里' + '\n 飞行距离',
													jsonIndentDeta.speed + '\n 飞行均速(节)',
													jsonIndentDeta.companyName + '\n 航司名',
													jsonIndentDeta.flightType + '\n 飞机型号',
													jsonIndentDeta.oil + "加仑" + '\n 耗油量',
												] //计算后的信息
												let oSpanCity = sys.getel("#secondCityName span"); //第一个span 起飞地  第二个降落地
												let oSpanairport = sys.getel("#secondFlyName span"); //机场名
												oSpanCity[0].innerText = jsonIndentDeta.startCity;
												oSpanCity[1].innerText = jsonIndentDeta.endCity;
												oSpanairport[0].innerText = jsonIndentDeta.startAirport.substr(0, 10) + '...';
												oSpanairport[0].title = jsonIndentDeta.startAirport;
												oSpanairport[1].innerText = jsonIndentDeta.endAirport.substr(0, 10) + '...';
												oSpanairport[1].title = jsonIndentDeta.endAirport;
												let oIarrow = sys.getel("#secondCityName i")[0]; //箭头
												switch(jsonIndentDeta.state) {
													case '正常':
														oIarrow.style.color = "#02ee02";
														oIarrow.title = "正常";
														break;
													case '晚点':
														oIarrow.style.color = "yellow";
														oIarrow.title = "晚点";
														break;
													default:
														oIarrow.style.color = "red";
														oIarrow.title = "该航班已取消";
														break;
												}
												let uiNameType = [];
												let arrSingleIdentData = [];
												for(let i = 0; i < 10; i++) {
													arrSingleIdentData.push({
														name: scatter10[i],
														value: uiValue[i],
														itemStyle: {
															normal: {
																color: scatterColor[i]
															}
														}
													})
												}

												secondXy.setOption({
													series: [{
														name: '航班详细信息',
														data: arrSingleIdentData,
													}]
												}); //setOption
												layer.closeAll(); //关闭自己
											}); //ident end
										}); //click end
									} //for 结束

								});
							}
							arrCity = [];
						}); //list request 结束
					}
					console.log(params.name);
				}
			}
			if(params.componentSubType == "lines") {
				console.log(params.data.fromName + ">" + params.data.toName); //来去城市							
			}
		});
	})();
	console.timeEnd("全局");
	//载入页面 根据设置的数据  进行ui检查与修改
	(function() {
		let checkbox = sys.getel("#checkbox")[0]; //油耗动画 oli
		let checkbox_lines = sys.getel("#checkbox_lines")[0]; //航线动画  //航线动画开关
		let linesHightColor = sys.getel("#lines_color")[0]; //航线高亮颜色
		let imageType = sys.getel("#imageType input"); //图片类型的两个input,[0]png,[1]jpeg
		let timedely = sys.getel("#timedely")[0]; //
		let timedelyNum = sys.getel("#timedelyNum")[0]; //设置界面显示的值
		let countryTop = sys.getel("#countryTop")[0];
		let countryTopNum = sys.getel("#countryTopNum")[0]; //设置界面显示的top国家数
		if(setUp.linesAnimation == true) {
			checkbox_lines.checked = 'checked';
		} else {
			checkbox_lines.checked = false;
		};
		if(setUp.oliAnimation == true) {
			checkbox.checked = 'checked';
		} else {
			checkbox.checked = false;
		};
		linesHightColor.value = setUp.linesHightColor;
		if(setUp.saveImageType == "png") {
			imageType[0].checked = 'checked';
			imageType[1].checked = false;
		} else {
			imageType[1].checked = 'checked'; //jpeg
			imageType[0].checked = false;
		}
		timedely.value = setUp.timeLineDelay; //时间轴 ,输入框(滑条)的值,从local读取,供初始用
		timedelyNum.innerText = setUp.timeLineDelay;
		countryTop.value = setUp.countryTop;
		countryTopNum.innerText = setUp.countryTop; //界面值
		let timedelytimer = null; //时间轴延迟设置用
		let timeCountyTop = null;
		(function() {
			function checkLines() { //航线动画开关
				if(this.checked) {
					map.setOption({
						series: [{
							name: '航线',
							animation: true,
							blendMode: "lighter",
							effect: {
								show: true,
								symbol: planePath,
							}
						}]

					});
					setUp.linesAnimation = true;
					sys.mySave.save('setUp', setUp);
				} else {
					map.setOption({
						series: [{
							name: '航线',
							animation: false,
							blendMode: "",
							effect: {
								show: false,
								symbol: '',
							}
						}]
					});
					setUp.linesAnimation = false;
					sys.mySave.save('setUp', setUp);
				} //else结束
			};

			function checkOli() {
				if(this.checked) {
					//								setTimeout(function(){
					//									c9.setOption({
					//									series: [{
					//										name: 'shuiqiu',
					//										waveAnimation: true,
					//										amplitude: 5,
					//									//	animationDuration: 1, //静止 提高性能
					//										//animationDurationUpdate: 1,
					//									}]
					//								});
					//								},1000);

					setUp.oliAnimation = true;
					sys.mySave.save('setUp', setUp);
				} else {
					c9.setOption({
						series: [{
							name: 'shuiqiu',
							waveAnimation: false,
							amplitude: 0,
							animationDuration: 0, //静止 提高性能
							animationDurationUpdate: 0,
						}]
					});
					setUp.oliAnimation = false;
					sys.mySave.save('setUp', setUp);
				} //else结束
			}

			function checkLinesHightColor() {
				console.log(this.value) //当前颜色
				map.setOption({
					series: [{
						name: '航线',
						lineStyle: {
							emphasis: {
								color: this.value
							}
						},
					}]
				});
				setUp.linesHightColor = this.value; //把input的value保存下来
				sys.mySave.save('setUp', setUp);
			};

			function checkSaveImageType() {
				for(let i = 0; i < 2; i++) {
					imageType[i].addEventListener('input', function() {
						if(this.checked) {
							setUp.saveImageType = this.getAttribute('id');
							sys.mySave.save('setUp', setUp);
							//console.log(setUp.saveImageType);
						}
					});
				}
			};

			function checkTimeDely() {
				//console.log(this.value);
				c5.setOption({
					baseOption: {
						timeline: {
							playInterval: this.value
						}
					}
				});
			}

			function checkCountryTop() {
				setUp.countryTop = this.value;
				sys.mySave.save('setUp', setUp);
			}
			countryTop.addEventListener('input', function() {
				clearTimeout(timeCountyTop);
				timeCountyTop = setTimeout(function() {
					checkCountryTop.apply(countryTop, []);
					layui.use('layer', function() {
						let layer = layui.layer;
						layer.msg('来往国家Top数成功修改为' + countryTop.value + '个,下次查询即可生效', {
							skin: 'optionMsg',
							icon: 1,
							time: 2000,
						});
					});
				}, 800);
				countryTopNum.innerText = this.value; //界面值实时刷新
			});
			checkTimeDely.apply(timedely, []);
			timedely.addEventListener('input', function() {
				let that = this;
				clearTimeout(timedelytimer);
				timedelyNum.innerText = this.value;
				timedelytimer = setTimeout(function() {
					checkTimeDely.apply(timedely, []);
					setUp.timeLineDelay = that.value;
					layui.use('layer', function() {
						let layer = layui.layer;
						layer.msg('每日航班概览自动播放间隔设置为' + that.value + '毫秒成功', {
							skin: 'optionMsg',
							icon: 1,
							time: 1500,
						});
					});
					sys.mySave.save('setUp', setUp);
				}, 800);
			});
			checkSaveImageType();
			checkLines.apply(checkbox_lines, []); //载入页面检测,修改this指向
			checkOli.apply(checkbox, []);
			checkbox_lines.addEventListener('input', function() {
				checkLines.apply(checkbox_lines, []);
			}); //checkbox_lines开关的oninput事件结束
			checkLinesHightColor.apply(linesHightColor, []); //航线高亮
			checkbox.addEventListener('input', function() {
				checkOli.apply(checkbox, []);
			});
			linesHightColor.addEventListener('input', function() {
				checkLinesHightColor.apply(linesHightColor, []);
			});
		})(); //内部闭包结束
	})();
	sys.getel('[menu=infoMe]')[0].addEventListener('click', function(e) {
		sys.getel("#about")[0].style.transform = "rotateZ(720deg) scale(1)";
		let oMenu = sys.getel("#menu")[0];
		oMenu.style.display = "none";
		e.stopPropagation();
	}, false);
	sys.getel("#about")[0].addEventListener('click', function(e) {
		sys.getel("#menu")[0].style.display = 'none';
		e.stopPropagation();
		return false;
	}, false);
	//实时通讯 
	(function() {
		let socket; //设置昵称头像完成后 再赋值
		let btnOpenChat = sys.getel('[tool=chat]')[0];
		let btnCloseChat = sys.getel('#chat .fa-close')[0];
		let oChat = sys.getel('#chat')[0];
		let oChat_title = sys.getel('#chat_title')[0];
		let chat_input = sys.getel('#chat_input')[0];
		let btnSend = sys.getel('#btnSend')[0];
		let info = sys.mySave.getsave('u');
		let chat_main_info = sys.getel('#chat_main_info')[0]; //聊天主消息 头像 昵称 
		let chat_main = sys.getel('#chat_main')[0]; //聊天可滚动窗口
		let btnBiaoqing = sys.getel('#biaoqing')[0];
		let biaoqing_box = sys.getel('#biaoqing_box')[0];
		//let yuanshiHTML='';//输入框没把/hj等转图片的原始内容
		//表情名 同时也是文件名 title名
		let imgName = ['hh', 'hj', 'jk', 'mg', 'ng', 'ok', 'ts', 'wx', 'yx', 'h', 'z', 'a', 'g', 'y', 'k', 'n', 'q', 't'];

		let fun = {

		}
		let chatStyle = oChat.style;
		let deviationX = 0,
			deviationY = 0,
			sumx = 0,
			sumy = 0;
		let stateDeviationX = 0;
		let state = true; //防止连续点击  而不移动的重复累加偏移量bug
		//拖动 使用css3技术  gpu重绘  性能更强
		oChat_title.onmousedown = function(e) {
			if(state) { //判断是否点击
				sumx += deviationX; //把移动最终偏移值累加(translate坐标相对于自身)
				sumy += deviationY;
				state = false; //第一次点击生效,否者想要生效  必须移动=>518row
			}
			let ev = e || event;
			let oldClint = {
				sx: ev.clientX,
				sy: ev.clientY
			};
			let youX = sumx - oldClint.sx; //先计算了已知的数据  ,不用移动时再计算,eMove.clientX-oldClint.sx+sumx,当前鼠标偏移量+累计偏移量
			let youY = sumy - oldClint.sy;
			fun.funMousemove = function(e) {
				state = true; //已经移动过(解决不停点击而不移动会不断累加  bug)					
				let eMove = e || event;
				//pageX和clentX一样  但是不会随着滚动条改变(始终为当前视觉 页面左上角)
				//left 和top改为transform 性能更强

				let nowClintX = eMove.clientX;
				let nowClintY = eMove.clientY;
				if(eMove.clientX >= innerWidth - 20) {
					nowClintX = innerWidth - 20;
				} else if(eMove.clientX <= 20) {
					nowClintX = 20;
				}
				if(eMove.clientY >= innerHeight - 20) {
					nowClintY = innerHeight - 20;
				} else if(eMove.clientY <= 20) {
					nowClintY = 20;
				}
				chatStyle.transform = `translateX(${nowClintX+youX}px) translateY(${nowClintY+youY}px)`; //let top版本等同search.offsetLeft+(新的鼠标位置-旧的鼠标位置),css3版  累加偏移量+当前偏移量	sumy+eMove.clientY-oldClint.sy,优化已知的	sumy-oldClint.sy再加									
				deviationX = nowClintX - oldClint.sx; //记录这次按下的最终偏移量
				deviationY = nowClintY - oldClint.sy;
			}
			doc.addEventListener('mousemove', fun.funMousemove);
			doc.addEventListener('mouseup', function() {
				doc.removeEventListener('mousemove', fun.funMousemove);
			});
		};
		//聊天界面拖动end
		//打开 关闭界面	
		//自定义输入框相关逻辑
		btnCloseChat.onclick = function() {
			oChat.className = '';
		};
		btnOpenChat.onclick = function() {
			//点击后去掉未读消息闪烁
			btnOpenChat.className = 'fa fa-commenting';
			let setName = sys.getel('#setName')[0];
			info = sys.mySave.getsave('u'); //取出用户信息
			chat_input.focus();
			//console.log(info)
			oChat.className = 'chat_show';
			//元素滚动到可见区域 false底部,true顶部
			//chat_main.scrollIntoView(false);
			//自动滚动到底部更好:
			chat_main.scrollTop = chat_main.scrollHeight;
			let onlineNum = sys.getel('#chat_title_onlineNum')[0];

			function receiveSocket() { //各类服务端--客户端socket订阅事件事件
				//正在连接中
				//用户点击提示框  可关闭
				loading_text.addEventListener('click', function() {
					loading_text.style.display = "none";
				});
				loading_text.style.display = "block";
				loading_text.style.opacity = "1";
				loading_title.innerText = '正在连接服务器...';
				loading_content.innerText = `您的昵称:${info[0]}`;
				let loadServer1 = setTimeout(function() {
					loading_text.style.opacity = "1";
					loading_text.style.display = "block";
					loading_title.innerText = '连接超时,即将重连...';
				}, 20000);
				let loadServer2 = setTimeout(function() {
					loading_title.innerText = '网络不佳哦,努力加载中';
				}, 5000);
				socket.open(); //额外的手动触发连接  connecting才生效
				//connect_error事件导致每次重连失败后都触发  使消息框快速消失
				//已连接事件
				socket.on('connect', function(data) {
					if(socket.connected) {
						console.log("连接服务器_成功 登录成功");
						//同步聊天记录
						socket.on('history', function(history) {
							//console.log(history)//字符串
							history = JSON.parse(history);
							//console.log(history)//数组
							if(history.length != 0) {
								for(let i = 0; i < history.length; i++) { //循环历史消息  如果是自己的 同步位置不同
									if(history[i].self[0] == info[0] && history[i].self[1] == info[1]) {
										chat_main_info.innerHTML += `<div class="self_info">					
									<span class="self_info_name">${info[0]}</span>
									<code class="${info[1]} self_info_photo" style=""></code>	
									<span class="uesr_info_chat">${history[i].chatText}</span>
								</div>`;
									} else {
										//其他人的消息
										chat_main_info.innerHTML += `<div class="other_info">				
												<span class="other_info_name">${history[i].self[0]}</span>
												<code class="${history[i].self[1]} other_info_photo" style=""></code>							
												<span class="other_info_chat">${history[i].chatText}</span>
										</div>`;
									}
								}
								chat_main.scrollTop = chat_main.scrollHeight;
								setTimeout(function() {
									console.log('历史记录同步成功');
									loading_text.style.display = "block";
									loading_text.style.opacity = "1";
									loading_title.innerText = '';
									loading_content.innerText = `成功同步${history.length}条历史消息`;
									setTimeout(function() {
										loading_text.style.opacity = "0";
										setTimeout(function() {
											loading_text.style.display = "none";
										}, 2000);
									}, 3000);
								}, 2000);

							}
						});
						//清除连接服务器提示框的定时器
						clearTimeout(loadServer1);
						clearTimeout(loadServer2);
						loading_text.style.display = "block";
						loading_text.style.opacity = "1";
						loading_title.innerText = '登陆中...';
						loading_content.innerText = `昵称:${info[0]},登陆成功`;
						//连接成功 可输入
						chat_input.setAttribute('contenteditable', true);
						//连接成功 自定义输入框自动获得焦点
						chat_input.focus();
						setTimeout(function() {
							loading_text.style.opacity = "0";
							setTimeout(function() {
								loading_text.style.display = "none";
							}, 2000);
						}, 1800);
					}
				});
				//						socket.on('connect_error',function(){
				//									loading_text.style.display = "block";
				//									loading_text.style.opacity = "1";
				//									loading_title.innerText = '连接失败,即将尝试重连';
				//									loading_content.innerText = `您的昵称:${info[0]}`;
				//									setTimeout(function() {
				//										loading_text.style.opacity = "0";
				//										setTimeout(function() {
				//											loading_text.style.display = "none";
				//										}, 2000);
				//									},3000);
				//						});
				//连接成功 (else里已有)
				//连接失败
				socket.on('connect_failed', function() {
					chat_input.setAttribute('contenteditable', false);
					loading_text.style.display = "block";
					loading_text.style.opacity = "1";
					loading_title.innerText = '连接服务器失败';
					loading_content.innerText = ``;
					setTimeout(function() {
						loading_text.style.opacity = "0";
						setTimeout(function() {
							loading_text.style.display = "none";
						}, 2000);
					}, 3000);
					socket.open(); //手动触发重连
				});
				//自定义消息事件
				socket.on('chat', function(receiveData) {
					receiveData = JSON.parse(receiveData);
					//对比用户名  头像 判断是否是自己,决定这条群发的消息是否显示(自己的消息不用从服务器获取  只判断发送成功否)
					if(receiveData.self[0] == info[0] && receiveData.self[1] == info[1]) {

					} else { //不是自己  从服务端接收socket消息
						chat_main_info.innerHTML += `<div class="other_info">								
												<span class="other_info_name">${receiveData.self[0]}</span>
												<code class="${receiveData.self[1]} other_info_photo" style=""></code>
												<span class="other_info_chat">${receiveData.chatText}</span>
											</div>`;

					}
					console.log("收到:" + JSON.stringify(receiveData));
					chat_main.scrollTop = chat_main.scrollHeight; //收到消息 也置底
					//如果页面处于隐藏状态(浏览器最小化/用户正在浏览器其他页面),系统将会在右下角发出系统通知
					//console.log('页面状态:'+document.hidden);
					if(oChat.className != 'chat_show') {
						btnOpenChat.className = 'fa fa-commenting newChatInfo';
					}
					//					if(document.hidden){
					//							let mynotifi = new Notification("『星云』您收到一条新消息", {
					//				                body: receiveData.chatText,
					//				                icon: 'img/favicon.png',
					//				                tag:1
					//       				  });
					//					}else{//页面未隐藏,但是聊天窗口未打开,聊天图标闪烁
					//						
					//					}
				});
				socket.on('onlineNum', function(num) {

					onlineNum.innerText = num;
				});
				//连接断开事件(已连接  然后中断)
				socket.on('disconnect', function() {
					chat_input.setAttribute('contenteditable', false);
					console.log('连接已断开');
					loading_text.style.display = "block";
					loading_text.style.opacity = "1";
					loading_title.innerText = '连接已断开';
					loading_content.innerText = `请检查您的网络环境`;
					setTimeout(function() {
						//loading_text.style.opacity = "0";
						setTimeout(function() {
							//loading_text.style.display = "none";
						}, 3000);
					}, 3000);
				});
				//连接错误事件
				socket.on('error', function(data) {
					chat_input.setAttribute('contenteditable', false);
					console.log("连接服务器出现错误");
					loading_text.style.display = "block";
					loading_text.style.opacity = "1";
					loading_title.innerText = '连接服务器出现错误';
					loading_content.innerText = `请检查您的网络环境哦`;
					setTimeout(function() {
						//loading_text.style.opacity = "0";
						setTimeout(function() {
							//loading_text.style.display = "none";
						}, 3000);
					}, 3000);
				});
				socket.on('reconnecting', function(num) {
					//没连上  不允许编辑
					chat_input.setAttribute('contenteditable', false);
					console.log('已尝试重连' + num + '次');
					if(num > 6) { //大于6次(最后为7次)  不再提醒  且关闭连接  关闭交流界面
						socket.close();
						oChat.className = '';
						loading_text.style.display = "block";
						loading_text.style.opacity = "1";
						loading_title.innerText = '为您重连6次全部失败';
						loading_content.innerText = `建议更换设备或网络环境!`;
						setTimeout(function() {
							loading_text.style.opacity = "0";
							setTimeout(function() {
								loading_text.style.display = "none";
							}, 3000);
						}, 8000);

					} else {
						loading_text.style.display = "block";
						loading_text.style.opacity = "1";
						loading_title.innerText = '网络不佳';
						loading_content.innerText = `正在进行第${num} / 6次重连`;
						//第一次消失的bug
						loading_text.style.opacity = "1";
						loading_text.style.display = "block";
					}
				});
			}
			//receiveSocket函数结束
			if(info == '' || info.length == 0 || !info) { //如果用户信息不正确/为空 切换到注册
				setName.style.display = 'block';
				let nowPhoto = sys.getel('#smile')[0];
				let sysPhoto = sys.getel('#smileList i');
				let btnSetName = sys.getel('#btnSetName')[0];
				for(let i = 0; i < sysPhoto.length; i++) {
					sysPhoto[i].addEventListener('click', function() {
						nowPhoto.className = this.className;
					});
				};
				btnSetName.addEventListener('click', function() {
					let pop = new tool.FunPopup("星云提醒", "确定这样设置您在线交流的昵称与头像吗?");
					pop.open(function() {
						let u = [];
						let name = sys.getel('#setName input')[0].value;
						name = name.substr(0, 6);
						u.push(name);
						u.push(nowPhoto.className);
						//console.log(u)
						sys.mySave.save('u', u);
						info = sys.mySave.getsave('u'); //用户信息
						setName.style.display = 'none';
						socket = io(); //参数默认为location.href//nginx已配置跨域(代理了websocket//)

						//接收消息不应该写在 btnSend 的事件里  接收消息本身就订阅了事件 否则会重复收到消息
						receiveSocket(); //第一次注册时
						//console.log(sys.mySave.getsave('u'))
					});
				});
			} else {
				setName.style.display = 'none';
				if(!socket) { //如果已经有实例就不再新建实例,没实例就创建一个
					socket = io(); //参数默认为location.href

					if(!(socket.connected)) { //每次点击都检查 是否已连接,没连接就重连	
						socket.open();
					}
					receiveSocket(); //后续(非第一次注册)打开在线交流时候

				} else {
					//已经连接 
					if(socket) {
						if(socket.connected) {
							loading_text.style.display = "block";
							loading_text.style.opacity = "1";
							loading_title.innerText = '';
							loading_content.innerText = `${info[0]}已在线`;
							setTimeout(function() {
								loading_text.style.opacity = "0";
								setTimeout(function() {
									loading_text.style.display = "none";
								}, 2000);
							}, 1800);
						}
					} else {
						socket = io();
					}

				}
			}
		};

		function Stopenter(e) {
			let eVent = e || event;
			if(eVent.keyCode == 13 || eVent.keyCode == 86) {
				eVent.preventDefault(); //换行多了  屏蔽回车与粘贴						
			}
		}
		//下面两个事件中文输入法时有用
		//compositionstart 输入框开始输入事件(虚拟文本)
		//compositionend 虚拟文本输入完成事件
		let inputState = false; //是否使用虚拟文本输入
		chat_input.addEventListener('compositionstart', function() {
			inputState = true;
		});

		//表情转义函数
		function funBQ() {
			//yuanshiHTML=chat_input.innerHTML;
			let kuaijieBQHTML = chat_input.innerHTML;
			for(let im = 0; im < imgName.length; im++) {
				//遍历 imgName 表情名数组  并且加到正则  使用正则替换输入框中的文本
				let re = new RegExp('\/' + imgName[im], "gim"); //有变量的正则不能使用字面量方式
				kuaijieBQHTML = kuaijieBQHTML.replace(re, `<img src='img/_${imgName[im]}.png' title='${imgName[im]}'/>`)
				//console.log(kuaijieBQHTML);

			} //循环结束 :被替换后 还原回去
			//innerHTML后输入框光标左对齐....
			//目前还无法根据光标位置插入表情
			chat_input.innerHTML = kuaijieBQHTML;
			//解决插入后 光标变成了左对齐, 事实上光标有两个
			if(window.getSelection) { //兼容火狐
				chat_input.focus();
				var range = window.getSelection(); //创建range
				range.selectAllChildren(chat_input); //range 选择obj下所有子内容
				range.collapseToEnd(); //光标移至最后
			} else if(document.selection) { //兼容
				var range = document.selection.createRange(); //创建选择对象
				//var range = document.body.createTextRange();
				range.moveToElementText(chat_input); //range定位到obj
				range.collapse(false); //光标移至最后
				range.select();
			}
		}
		chat_input.addEventListener('input', function() {
			let divLength = sys.getel('#chat_input div');
			//let saveDivText = '';//取出div里的文本(换行后 内容在div里)

			//console.log(divLength.length);
			if(divLength.length > 7) {
				doc.addEventListener('keydown', Stopenter);
			} else {
				doc.removeEventListener('keydown', Stopenter);
			};
			//			for(let div = 0; div < divLength.length; div++) {
			//				saveDivText += divLength[div].innerText;
			//			}
			//chat_input.innerHTML=chat_input.innerText+saveDivText;
			if(chat_input.innerText.length >= 200) {
				//截取前200字
				chat_input.innerHTML = chat_input.innerText.substr(0, 200);
			}
			//imgName
			//先取到输入框内容(带标签)
			//这里用innerHTML 再次输入内容 表情会消失,  用innerText 又无法保存之前的表情 
			//曲线救国...  因为自定义添加表情 转义会根据/ 加表情名 进行,而标签中路径又会有 / 会转义表情 继续添加img...
			//把所有图片前面加_ 数组只作为映射

			if(inputState) { //使用中文输入法 出现虚拟文本时 就虚拟文本完成才转义表情
				chat_input.addEventListener('compositionend', funBQ);
				inputState = true; //
			} else { //否则直接转义
				//下面无效 目前只能中文状态(虚拟文本)下转义表情,否则转义不齐全/或者虚拟与实际混输导致输入框内容多余(打拼音会出入拼音和汉字)
				funBQ();
			}

			;
		});
		//选择表情
		let biaoQing_none = null;

		function clickBQ() { //鼠标移入 调用
			let img = biaoqing_box.querySelectorAll('img');
			for(let m = 0; m < img.length; m++) {
				//	console.log(img.length);
				//使用addEventListener('click')会出bug 事件绑定的函数在for会被累加
				img[m].onclick = function() {
					chat_input.innerHTML += '/' + img[m].getAttribute('title');
					funBQ();
				};
			}
		}
		btnBiaoqing.addEventListener('mouseover', function() {
			clearTimeout(biaoQing_none); //避免移出后再移入表情框  被前一次定时器关掉
			biaoqing_box.style.display = 'block';
			let img = biaoqing_box.querySelectorAll('img');
			let strImgTag = '';
			if(img.length == 0) { //如果biaoqing_box里没有图片(表情) 才插入
				for(let i = 0; i < imgName.length; i++) { //插入图片路径   title
					strImgTag += `<img src='img/_${imgName[i]}.png' title='${imgName[i]}'/>`;
				}
				//累加后 再inner  提升性能
				biaoqing_box.innerHTML = strImgTag;

			} else {
				clickBQ();
			}
		});

		btnBiaoqing.addEventListener('mouseout', function() {
			//鼠标移出至少 500毫秒后才隐藏 防止用户无法移入表情框
			clearTimeout(biaoQing_none);
			biaoQing_none = setTimeout(function() {
				biaoqing_box.style.display = 'none';
			}, 500);

		});
		btnSend.addEventListener('click', function() {
			//let divLength = sys.getel('#chat_input div');
			//let old_chat_mainInnerHTML = chat_main.innerHTML;//保存前一次
			//let saveDivText = '';
			//console.log(chat_input.querySelectorAll('img')[0].toString())
			//let imgs = chat_input.querySelectorAll('img');
			let nowInputInnerHTML = chat_input.innerHTML;
			//把img标签转为自定义的'暗号',传输更少的文本 也不怕截断250字导致标签错乱
			//			for(let iRe=0;iRe<imgs.length;iRe++){
			//				nowInputInnerHTML=nowInputInnerHTML.replace(/^<img.*>$/,'/'+imgs[iRe].title);
			//				console.log(nowInputInnerHTML);
			//			}
			//			if(imgs.length>9){
			//				imgs.length=9;
			//			}
			let sendStr = nowInputInnerHTML.substr(0, 340);
			//if(sendStr[250]&&(sendStr[250]=='>'||sendStr[250]=='<'))
			let sendData = {
				self: info,
				chatText: sendStr
			};
			if(sendData.chatText) {
				chat_main_info.innerHTML += `<div class="self_info">					
							<span class="self_info_name">${sendData.self[0]}</span>
							<code class="${sendData.self[1]} self_info_photo" style=""></code>	
							<span class="uesr_info_chat">${sendData.chatText}</span>
						</div>`;

				chat_main.scrollTop = chat_main.scrollHeight;
				socket.emit('chat', sendData, function(state) {
					if(state == 'send_ok') {
						console.log('发送成功');
					} else {
						//应该用超时
						loading_text.style.display = "block";
						loading_text.style.opacity = "1";
						loading_title.innerText = '发送失败';
						loading_content.innerText = `网络不佳哦!`;
						setTimeout(function() {
							loading_text.style.opacity = "0";
							setTimeout(function() {
								loading_text.style.display = "none";
							}, 1800);
						}, 1400);
					}
				});
			} else {
				if(socket.connected) {
					loading_text.style.display = "block";
					loading_text.style.opacity = "1";
					loading_title.innerText = '';
					loading_content.innerText = `请输入消息`;
					setTimeout(function() {
						loading_text.style.opacity = "0";
						setTimeout(function() {
							loading_text.style.display = "none";
						}, 2000);
					}, 1800);
				}
			}

			sendData.chatText = '';
			chat_input.innerHTML = ''
		});

	})(); //在线交流模块结束
};
//↑ window.onload结束
//			var oNum = new CountUp("count", 0, 1009, 0, 2.5, {
//				useEasing: true,
//				useGrouping: true,
//				separator: ',',
//				decimal: '.',
//			});
//			oNum.start(function() {
//				oNum.update(3242, 1, 1, function() {
//					console.log("更新回调");
//				});
//			});
//setTimeout(function() {}, 3000);