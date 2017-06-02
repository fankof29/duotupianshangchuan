/*
 * 基于张鑫旭多文件上传修改的多文件上传系统 http://www.zhangxinxu.com/wordpress/?p=1923
 * @author (范彪)
*/

/*
 * 多文件预览,上传,删除
 * @param  obj {obj} 文件上传的设置
 */
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

	this.init();
}
FFile.prototype = {
	//获取选择文件，file控件或拖放
	funGetFiles: function(e) {			
		// 获取文件列表对象
		var files = e.target.files || e.dataTransfer.files;
		//继续添加文件
		this.FileSet.fileFilter = this.FileSet.fileFilter.concat(this.FileSet.filter(files));
		this.funDealFiles();
		return this;
	},
	
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
	/*
	 * 对保存在fileFilter的图片,生成预览
	 * @param file {array} 传递进来的含有所有file的数组
	 */
	onSelect: function(files) {
		var html = '', 
			self = this,
			i = 0;
		$(this.FileSet.pre).html();//清空预览地址
		var funAppendImage = function() {
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
	}
}