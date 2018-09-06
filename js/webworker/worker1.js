//worker里 worker对象是全局的  onmessage postMessage不需要指定对象  所有方法都不用 ,例如close();
onmessage=function(e){
	console.log("我是worker里的:"+e.data);
	let a=0;
	for(let i=0;i<9999999;i++){
	
		if(a==5){
			close();
		}else{
			a++;
		}
	}
	postMessage(a);
}

