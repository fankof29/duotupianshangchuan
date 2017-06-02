# 基于html5的多图片上传

本文是建立在张鑫旭大神的多文图片传的基础之上.  
首先先放出来大神多图片上传的博客地址:<http://www.zhangxinxu.com/wordpress/2011/09/%E5%9F%BA%E4%BA%8Ehtml5%E7%9A%84%E5%8F%AF%E9%A2%84%E8%A7%88%E5%A4%9A%E5%9B%BE%E7%89%87ajax%E4%B8%8A%E4%BC%A0/>

代码思路
-------
因为html5开放了multiple, 可以让用户一次上传多个文件.
所以,最开始,我们需要建立这样的html.  
```
<input type="file" name="fuck" multiple="" id="js-file">//上传文件区域
<div id="js-pre"></div>//图片预览区域
<button id="js-button" type="button">提交</button>//提交按钮
```
这个时候,我们就可以直接通过获得input里面的files(不明白的同学可以百度一下),然后循环.提交给服务器.但是,我们会遇到另外一个问题.如果,用户提交了一个图片,但是用户忽然觉得,我不想提交这个.我这个不要了,我要提交其他几个. 这种情况就非常的尴尬了.(用户真特么事逼┑(￣Д ￣)┍).  
所以,我们需要一个数组,临时存储这些上传的数据.当用户删除之前上传的图片的时候,我们可以在那个临时的数组中,删除相应的数据.  
打一个比方.用户通过input选择了ABC三个图片.  
然后,我们循环input的files,然后依次把ABC加入到我们的临时数组x中.  
这个时候,用户不想上传A图片了,他想删除A. 于是,贴心的我们,从临时数组删除A.  
接下来,我们的图片预览以及上传图片都来自临时数组x的内容.这样,无论用户怎么折腾,贴心无比的我们,都可以满足用户的需求.  
带着这样的思路.我们开始扯淡.  
***
如果有懒惰党,可以直接下载代码使用.但是代码的地址在最下面哦~
***
完成这个多文件上传.我们要做到以下几点要求(所以是几点?)  
* 可以复用(这段代码可以在一个页面多次使用,不会相互冲突)
* 我们要根据用户选择上传图片->完成文件的预览和删除
* 用户选择提交代码的时候,进行文件传输,传输成功的时候,提供success(response){},提供完成相应的回调,同时也提供Failure(response){},进行提交失败的处理.以及Complete(){},提交完成的处理.
### 所以,我们从以上几点,一点一点的开始.
***
可以复用.  
可以复用的意思是,使用者(不想造轮子的程序猿),可以在使用的时候,传递一个obj,里面带有以下参数  
* 用来上传文件的input的id
* 触发提交的button的id
* 预览图片的div的id
* 后端的url
* 唯一的文件名称,为了在html中与其他的多图片上传进行划分
* 上传成功的函数
* 上传失败的函数
* 上传完成的函数
* 对上传图片过滤的函数(可选) 可供使用者设置处理图片
所以,我们可以设置一个obj.
```
    obj = {
        name: obj.name? obj.name:null,								//唯一名,用来与其他文件区分
		fileInput: obj.fileInput?obj.fileInput: null,				//html file控件
		upButton: obj.upButton? obj.upButton:null,					//提交按钮
		pre: obj.pre?obj.pre:null,									//预览地址
		url: obj.url? obj.url:null,									//ajax地址					
		fileFilter: [],					                            //过滤后的文件数组
		filter: obj.filter?obj.filter:function(files){
            var arrFiles = [];
            for (var i = 0, file; file = files[i]; i++) {
                if (file.type.indexOf("image") == 0) {
                    arrFiles.push(file);     
                } else {
                    alert('文件"' + file.name + '"不是图片。');    
                }
            }
            return arrFiles;
        },	                                        			    //过滤的文件,默认判断如果是图片可以加入临时数组
		onSuccess: obj.onSuccess?obj.onSuccess:function(data){
            console.log('success');
        },	                                                    	//文件上传成功时
		onFailure: obj.onFailure?obj.onFailure:function(data){
            console.log('error');
        },	                                                    	//文件上传失败时,
		onComplete: obj.onComplete?obj.onComplete:function(){
            console.log('complete');
        },	                                                    	//文件全部上传完毕时
    }
```
然后我们需要一个函数,这个函数里面包含了我们生成多图片预览,删除,上传等功能.将obj传入到函数FFile().  
这样,我们就可以通过 var fuck = new FFile(obj) 创建一个可以复用的多文件上传.  
外部构造基本结束,接下来,就可以进行 FFile(){}的内部处理.  
```
    function FFile(obj) {
	this.FileSet = {
		name: obj.name? obj.name:null,								//唯一名,用来与其他文件区分
		fileInput: obj.fileInput?obj.fileInput: null,				//html file控件
		upButton: obj.upButton? obj.upButton:null,					//提交按钮
		pre: obj.pre?obj.pre:null,									//预览地址
		url: obj.url? obj.url:null,									//ajax地址					
		fileFilter: [],					                            //过滤后的文件数组
		filter: obj.filter?obj.filter:function(files){
            var arrFiles = [];
            for (var i = 0, file; file = files[i]; i++) {
                if (file.type.indexOf("image") == 0) {
                    arrFiles.push(file);     
                } else {
                    alert('文件"' + file.name + '"不是图片。');    
                }
            }
            return arrFiles;
        },	                                        			    //过滤的文件,默认判断如果是图片可以加入临时数组
		onSuccess: obj.onSuccess?obj.onSuccess:function(data){
            console.log('success');
        },	                                                    	//文件上传成功时
		onFailure: obj.onFailure?obj.onFailure:function(data){
            console.log('error');
        },	                                                    	//文件上传失败时,
		onComplete: obj.onComplete?obj.onComplete:function(){
            console.log('complete');
        },	    
	}

	this.init();//一会再给你们说这个是干嘛的(笑)
}
```
接下来我们要处理的事情有两个.
1. 我们要根据用户选择上传图片->完成文件的预览和删除
2. 用户选择提交代码的时候,进行文件传输,传输成功的时候,提供success(response){},提供完成相应的回调,同时也提供Failure,complate.
### 首先是第一个
当用户上传文件后,会触发change事件.  
然后,我们根据change事件,可以调用一个函数,这个函数把过滤后的图片(不符合图片要求),加入到临时数组fileFilter中.
```
    	funGetFiles: function(e) {			
		// 获取文件列表对象
		var files = e.target.files || e.dataTransfer.files;
		//继续添加文件
		this.FileSet.fileFilter = this.FileSet.fileFilter.concat(this.FileSet.filter(files));
		this.funDealFiles();//下面讲解这个是啥(┑(￣Д ￣)┍)
		return this; //方便进行链式操作,类似jq的$().xx().xx().xx();
	},
```
因为,用户可能对上传的图片,进行删除.这样,我们要知道用户删除了哪个图片,我们才能在数组fileFilter中删除相应的图片.于是乎,我们就增加了一个索引值.  
```
    	//选中文件的处理与回调
	funDealFiles: function() {
		for (var i = 0, file; file = this.FileSet.fileFilter[i]; i++) {
			//增加唯一索引值
			file.index = i;
		}
		//执行选择回调
		this.onSelect(this.FileSet.fileFilter);
		return this;
	},
```
然后就要在预览区域显示图片,同时为预览的图片增加删除选项,如何获得上传图片的地址.我采用了FileReader,本文不讨论这个.想知道关于FileReader,请自行百度.
```
    /*
	 * 对保存在fileFilter的图片,生成预览
	 * @param file {array} 传递进来的含有所有file的数组
	 */
	onSelect: function(files) {
		var html = '', 
			self = this,
			i = 0;
		$(this.FileSet.pre).html();//清空预览地址
		var funAppendImage = function() { //因为调用FileReader(),在FileReader.onload里面,进行的数值的修改,无法带到外面来,就像是,一个只允许进不允许出的盒子(原谅我不恰当的比喻),所以,可以通过递归的放置,来保存对var html的修改.
		    file = files[i];

		    if (file) {
		        var reader = new FileReader()
		        reader.onload = function(e) { //生成的图片
		            html += '<div id="js-uploadList_'+self.FileSet.name+i+'" class="img-box">';
		            html += 	'<div class="img-border">';
		            html += 		'<span class="js-upload_delete icon-delete_fill red" data-index="'+ i +'"></span>';
		            html += 		'<img src="'+e.target.result+'"></img>';
		            html +=		'</div>';
		            html += '</div>';
		            
		            i++;
		            funAppendImage();
		        }
		        reader.readAsDataURL(file);
		    } else {
		        $(self.FileSet.pre).html(html);
		        if (html) {
		            //删除方法
		            $(".js-upload_delete").click(function() {
		                self.funDeleteFile(files[parseInt($(this).attr("data-index"))]);
		                return false;   
		            }); 
		        }
		    }
		};
		funAppendImage();  
	},
```
接下来是删除的方法,这里分为两个步骤.一个是删除临时数组中的图片,另一个是删除html中的图片(在这里,利用了FileSet.name划分多个多图片上传.)
```
//删除对应的文件
	funDeleteFile: function(fileDelete) {
		var arrFile = [];
		for (var i = 0, file; file = this.FileSet.fileFilter[i]; i++) {
			if (file != fileDelete) {
				arrFile.push(file);
			} else {
				this.onDelete(fileDelete);	
			}
		}
		this.FileSet.fileFilter = arrFile;
		return this;
	},
	/*
	 *删除函数
	 *@param fileDelete {str} 传递过来要删除的File
	 */
	onDelete: function(file){//清除图片
		let self = this;
	 	$("#js-uploadList_" + self.FileSet.name+ file.index).empty();
	},
```
### 然后是第二个
第二个使用了FormData来传输多文件的数据.不明白的小伙伴可以继续百度FormData.代码简单,直接阅读即可.
```
//文件上传
	funUploadFile: function() {
		var self = this;	
		if (location.host.indexOf("sitepointstatic") >= 0) {
			//非站点服务器上运行
			return;	
		}
		for (var i = 0, file; file = this.FileSet.fileFilter[i]; i++) {
			(function(file) {	
				var formData = new FormData();
				formData.append(self.FileSet.name,file);
				$.ajax({
					url: self.FileSet.url,
					type: 'post',
					data: formData,
					contentType: false,  
					processData: false, 
					success: function(data) {
						self.FileSet.onSuccess(data);
						self.funDeleteFile(file);
					},
					error: function(data) {
						self.FileSet.onFailure(data);
					}
				})
				if(!self.FileSet.fileFilter.length){
					//执行完成
					self.FileSet.onComplete();
				}
			})(file);	
		}	
			
	},
```
### 最后就是一开始提到的init()
就是初始化一些东西啦~~~
```
init: function() {
		var self = this;
		//判断必须参数是否为空
		if(self.FileSet.fileInput == null || self.FileSet.pre == null || self.FileSet.upButton == null) {
			console.log('必须提供 input的id 预览区的id 以及 button的id');
			return false;
		}
		//文件选择控件选择
		if (self.FileSet.fileInput) {
			// self.FileSet.fileInput.addEventListener("change", function(e) { self.funGetFiles(e); }, false);	
			$(self.FileSet.fileInput).on('change',function(e){
				self.funGetFiles(e);
			})
		}
		
		//上传按钮提交
		if (self.FileSet.upButton) {
			// self.FileSet.upButton.addEventListener("click", function(e) { self.funUploadFile(e); }, false);	
			$(self.FileSet.upButton).on('click', function(e) {
				self.funUploadFile(e);
			})
		} 
```

基本上,一个多图片上传的思路就是这样的~
以上.
另外这里是源代码地址.
