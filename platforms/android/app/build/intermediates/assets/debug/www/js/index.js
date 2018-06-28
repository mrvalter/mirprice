var chart = {};
var data = {	
	
	user: {
		'name': "alexander",
		
	},		

	points: {
		"1" : []
	},
	
	translates: {}
	
};



		
var loadInterval;


var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },   
	
    onDeviceReady: function() {		
        this.receivedEvent('deviceready');
		document.addEventListener("backbutton", this.onBackKeyDown_callback, false);
		
			  		  
    },
		
    // Update DOM on a Received Event
    receivedEvent: function(id) {				
		
		
		this.options.uid = device.uuid ? device.uuid : '';
		
		/* Инициализируем страницы и помещаем их за окно */	
		$('.page').css({
			left: app._getDisplayWidth(),
			width: app._getDisplayWidth(),
			"min-height": "100%"
		});				
			
		$('#page-catalog').on('click', '.list-group a', function(){
			console.log("click catalog");
			app.showCatalogDetail($(this).data("id"));
		});				
		
		this.setAppParam(function(){				
			/* Получаем данные с сервера */
			app.getServerData(app.buildTemplates);
		}, function(){
			
		});
		/* Загружаем настройки */
		/*console.log(cordova.file.dataDirectory);
		window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
			console.log('file system open: ' + dirEntry.name);
			var isAppend = false;
			createFile(dirEntry, "options.json", isAppend);
		}, function(e){
			console.log("Failed file read: " + e.toString());
		});*/			
    },		
		
	localloads: {},
	sideBar: null,
	pageShowed: null,
	isSettingsBuild: false,
	sidebar_width: 300,
	pageAnimateSpeed: 100,
	server_url: "http://mirprice.com/api/api.php",
	//server_url: "http://77.41.7.198/api/api.php",
	chart: {},
	test: 1,
	options_dir: "options",
	
	options: {
		currency: "usd",
		language: "en",
		uid: '',
		sessid: ''
	},
	mmfs: {},
	localPathRoot: "",
	
	user: {},

	setSessId: function(sessid){
		this.options.sessid = sessid;
	},
	
	setAppParam: function(success,fail) {
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, 
            function(fs) {
                app.mmfs = fs;
                app.localPathRoot = fs.toURL();                
				console.log('Корневая директория:'+app.localPathRoot);
				app.mmfs.getDirectory(app.options_dir, {create: true, exclusive: false}, 
					function(directoryEntry){ 											
						console.log("Директория "+directoryEntry.fullPath+" готова");
						
						app.readFile(app.options_dir+"/",'options.json',
							function (data) {
								console.log("data = "+ data);
								let foptions = JSON.parse(data);
								if(foptions.options !== undefined){
									app.options = foptions.options;																		
								}
								if(foptions.user !== undefined){
									app.setUser(foptions.user);
								}
								app.initUserTemplates();
								success();
							},
							function (error) { alert(error); success(); }
						);
						
					},
					
					function(error){
						fail("Директория options не создана!");
					}                            
				);
            },
            function () { navigator.notification.alert('Нет доступа к файловой системе',function(){},'ERROR','Закрыть'); fail(); }
        )
    }, 
	
	readFile: function (filePath,fileName,filedata,fail) 
    {
		console.log("Пробуем прочесть файл "+ filePath +" "+ fileName);
        if (filePath.trim()!=="") {
            if (filePath.substr(-1)!=="/") { filePath=filePath+"/"; }
            if (filePath.substr(0,1)=="/") { filePath=filePath.substr(1); }                    
        }
		console.log("Путь =  " + filePath);
        app.mmfs.getDirectory(filePath, {create: false, exclusive: false}, 
            function(directoryEntry) {               
                directoryEntry.getFile(fileName, {create: false, exclusive: false}, 
                    function(fileEntry){                        
                        fileEntry.file(
                            function (file) {
								console.log("файл "+fileName+ " найден, читаем ");
                                var reader = new FileReader();
                                reader.onloadend = function (evt) {
                                    console.log("файл прочитан");
                                    filedata(evt.target.result);
                                };
                                reader.readAsText(file);
                            },                                
                            function(error){
                                console.log("Не удалось открыть файл "+fileName+"!");
                                fail("Не удалось открыть файл "+fileName+"!");
                            }  
                        );
                    }, 
                    function(error){ console.log("Не удалось найти файл "+fileName+"!"); fail("Не удалось найти файл "+fileName+"!"); }
                );
            }, 
            function(error){ console.log("Директория "+filePath+" отсутствует!"); fail("Директория "+filePath+" отсутствует!"); }                         
        ); 
    },
	
	saveFile: function (filePath,fileName,filedata, success, fail) 
    {   
        if (filePath.trim()!=="") {
            if (filePath.substr(-1)!=="/") { filePath=filePath+"/"; }
            if (filePath.substr(0,1)=="/") { filePath=filePath.substr(1); }                    
        }
        app.mmfs.getDirectory(filePath, {create: false, exclusive: false}, 
            function(directoryEntry) {
                directoryEntry.getFile(fileName, {create: true, exclusive: false}, 
                    function(fileEntry){
                        fileEntry.createWriter(
                            function(writer){
                                writer.write(filedata);                                         
                                console.log(fileEntry.toURL());
                                success(fileEntry);
                            }, function(error){
                                fail("Ошибка записи данных в файл "+fileName+"!");
                            });
                    }, function(error){
                        fail("Ошибка открытия/создания файла "+fileName+"!");
                    });
            },
            function(error){
                fail("Нет директории "+filePath+"!");
            }
        );
    },
	
	setUser: function(user){
		
		console.log("Устанавливаем пользвателя");
		console.log(user);
		if(user.id === this.user.id){
			return true;
		}
		
		this.user = user;		
		
	},
	
	drawCatalogDetail: function(resp_data){
		app.initUserTemplates();
		var points =  resp_data.points;
		app.chart = app.buildChart(points);
		app.buildMessages(resp_data.messages);
	},
	
	buildMessages: function(messages){
		var html = "";
		for(let i=0; i<messages.length; i++){						
			html += `
			<div class="item">            
              <p class="message">
                <a href="#" class="name">
                  <small class="text-muted pull-right"><i class="fa fa-clock-o"></i> 6:10</small>
                  `+messages[i].mAuthor+`
				</a>
                `+messages[i].message+`
              </p>
            </div>`;			
		}
		
		$("#chat-box").html(html);
		
	},
	
	initUserTemplates: function(){
		console.log("Пользователь авторизован " + app.isAuthorize());
		if(!app.isAuthorize()){
			console.log("Пользователь авторизован " + app.isAuthorize());
			$("#detail-message-write-container").css({display:"none"});
			$("#detail-message-please-login").css({display:"block"});
			$("#header-login").html("");
		
			console.log("показываем контейнер логина");
			$('#enter-container').css({display:"block"});
		
			return true;
		}
		
		$('#enter-container').css({display:"none"});
		$("#detail-message-write-container").css({display:"block"});
		$("#detail-message-please-login").css({display:"none"});
		$("#header-login").html(this.user.name);
	},
	
	isAuthorize: function(){
		return this.user.id ? true : false;
	},
	getServerData: function(callback){
		this.LoadImgShow();
		
		if(!this.checkConnection()){
			this.LoadImgHide();
			
			navigator.notification.confirm(
				'Web connection error! Try again ?', // message
				 app.onConfirmReLoadNet,		   // callback to invoke with index of button pressed
				'no internet connection',           // title
				['Yes','Cancel']     // buttonLabels
			);
			return false;
		}
		
		if(typeof cordova === 'undefined'){
			return callback();
		}						
		
		this.sendRequest({}, "getfulldata", function(resp_data) {				
			app.LoadImgHide();
			data = resp_data;																
			if(callback !== undefined){
				console.log(callback);
				callback();
			}
		});
			
		return true;				
	},

	checkConnection: function(ontrue, onfalse) {		
				
		return !(navigator.connection.type === Connection.NONE);
		
		/*var states = {};
		
		states[Connection.UNKNOWN]  = 'Unknown connection';
		states[Connection.ETHERNET] = 'Ethernet connection';
		states[Connection.WIFI]     = 'WiFi connection';
		states[Connection.CELL_2G]  = 'Cell 2G connection';
		states[Connection.CELL_3G]  = 'Cell 3G connection';
		states[Connection.CELL_4G]  = 'Cell 4G connection';
		states[Connection.CELL]     = 'Cell generic connection';
		states[Connection.NONE]     = 'No network connection';
		*/

	
	},
	
	sendRequest: function(params, action, callback, callbackerror){
		
		console.log("SEND REQUEST, callback = ");		
		
		app.LoadImgShow();
		if(action){
			params.action = action;
		}
		
		let http_params = Object.assign(params, app.options);
		
		oneErrorRequest = function() {				
				
			onerror = function(buttonIndex){
				if(buttonIndex === 1){
					app.sendRequest(params, action, callback, callbackerror);
					return true;
				}else{
					navigator.app.exitApp();
				}
			};

			app.LoadImgHide();
			navigator.notification.confirm(
				  'Error server connection!', // message
				   onerror,            // callback to invoke with index of button pressed
				  'Error',           // title
				  ['Try again','Exit']     // buttonLabels
			);				
		};
		
		//Authorization: 'OAuth2: token'
		cordova.plugin.http.post(this.server_url, http_params, 
			{ }, function(response) {
				app.LoadImgHide();
				
				let respdata = {};
					
				try {
					respdata = JSON.parse(response.data);
				} catch (e) {
					oneErrorRequest();
					return false;
				}
								
				if(respdata.result){
					if(respdata.sessid !== undefined){
						app.setSessId(respdata.sessid);						
					}
					else{
						app.setSessId(null);
					}
					
					if(respdata.user !== undefined){
						app.setUser(respdata.user);						
					}else{
						app.setUser({});
					}
					if(typeof callback === "function"){
						callback(respdata.data);					
					}
					
					app.saveOptionsIntoFile();
				}else{
					if(typeof callbackerror === "function"){
						callbackerror(respdata);
					}else{
						alert("send request error! " + respdata.error);
					}
				}
				
				return true;
				
			}, oneErrorRequest);
	},
		
	saveOptionsIntoFile: function(){
		let fileObj = {
			options: app.options,
			user: app.user
		};
		app.saveFile(app.options_dir, "options.json", JSON.stringify(fileObj),
		
		function(){
			console.log("файл успешно сохранен");
		},
		
		function(){
			console.log("Не удалось сохранить файл с настройками");	
		});
	},
	
	getCurrencyIcon: function(){
		for(let i = 0; i < data.translates.currencies.length; i++){
			if(data.translates.currencies[i].code == app.options.currency){
				return data.translates.currencies[i].icon;
			}
		}		
	},
	
	rebuild: function(){		
		app.getServerData(app.rebuildTemplates);
	},
		
	/*onConfirmReLoadNet: function(label){		
		if(label == 1){
			app.getServerData(app.buildTemplates);
		}else{
			navigator.app.exitApp();
			return false;
		}
	},*/
	
	LoadImgShow: function(){
		clearInterval(loadInterval);
		$('#load_back').css({display:"block"});
		
		$('#img').css({display:"block"});
		loadInterval = setInterval(function() {
			$("#img").rotate({
			  angle:0,
			  animateTo:360,	
			});

		}, 200);	
		console.log(loadInterval);
	},
	
	LoadImgHide: function(){
		clearInterval(loadInterval);
		$('#load_back').css({display:"none"});
		$('#img').css({display:"none"});		
				
		console.log("clear "+loadInterval);
	},
		
	loadLocal: function(id, file, callback){
				
		if(this.localloads[id]!== undefined){
			return true;
		}
								
		if(id == "sidebar"){
			this.sideBar = $('#'+id);
		}
				
		let app = this;
				
		$('#'+id).load(file, function(){
			console.log("sidebar загружен");
			app._translate(id);					
			app.localloads[id] = true;			
			if(callback){
				callback();
			}
		});										
	},			
	
	showPage: function(id, isanimate, callback){
		if(isanimate === undefined){
			isanimate  = true;
		}
				
		if(this._isMenuShowed()){			
			this._hideMenu(id);
			return true;
		}
		
		let page = $('#'+id);
		let loadPage = page.data("load");				
		
		/* Если страница не загружена загружаем ее и показываем */
		if(loadPage !== undefined && this.localloads[id] === undefined){			
			return this.loadLocal(id, loadPage, this.showPage.bind(this, id, isanimate, callback));
		}
							
		$('#'+id).scrollTop(0);
		
		let display_width = this._getDisplayWidth();		
		
		
		if(isanimate){			
			if(id !== this.pageShowed && this.pageShowed !== null){
				$('#'+this.pageShowed).animate({left: '-='+display_width}, this.pageAnimateSpeed, function(){
					$(this).css({left: display_width});
				});
			}
						
			page.animate({left: 0}, this.pageAnimateSpeed);
			
		}else{
			if(id !== this.pageShowed && this.pageShowed !== null){				
				$('#'+this.pageShowed).css("left", display_width+"px");
				console.log($('#'+this.pageShowed).css("left"), display_width+"px !!!!!!!!!!!!!!!!");
			}
			
			page.css({				
				left: 0,
			});
		}												
		
		this.pageShowed = id;
		if(typeof callback === 'function'){
			callback();
		}
		
	},
	
	
	toggleMenu: function() {		
        if(this._isMenuShowed()){            
			this._hideMenu();
        }else{
            this._showMenu();
        }
    },		
	
	showCatalogDetail: function(item_id){		
		app._hideMenu();
		app.showPage("page-catalog-detail", true, app._initCatalogDetail.bind(this, item_id));						
	},
	
	_initCatalogDetail: function(item_id){
		
		app.detail_id = item_id;
		let params = {			
			item_id: item_id.toString(),
			currency: app.options.currency
		};
		
		
		this.sendRequest(params, "getstatisticbyitemid", function(resp_data) {			
			  app.drawCatalogDetail(resp_data);
		});
		
		return true;		
	},			

	buildSettings: function(){
		$('#settings-language').html("");
		$('#settings-currency').html("");
		let languages = data.translates.languages;
		for(let i=0; i< languages.length; i++){
			let selected = languages[i].code == app.options.language ? 'selected="selected"' : "";
			$('#settings-language').append('<option value="'+languages[i].code+'" '+ selected +'>'+languages[i].name+'</option>');
		}

		let currencies = data.translates.currencies;
		for(let i=0; i< currencies.length; i++){
			console.log(currencies[i].code, app.options.currency);
			let selected = currencies[i].code == app.options.currency ? 'selected="selected"' : "";
			$('#settings-currency').append('<option value="'+currencies[i].code+'" '+ selected +'>'+currencies[i].name+'</option>');
		}
	},
	rebuildTemplates: function(){
		app.buildCatalog();
		app.buildSettings();
		app._translate("pages-content");		
		app.showPage("page-catalog", false);
	},
	
	buildTemplates: function(){
		app.buildCatalog();
		app.loadLocal("sidebar", "sidebar.html", app.initUserTemplates);
	},
	
	buildCatalog: function(){		
		let strhtml = '<div class="list-group">';
		if(data.catalog === undefined){
			return false;
		}
		for(let i=0; i< data.catalog.length; i++){
			let bgcolor = '';			
			let item = data.catalog[i];
			
			if(item.simb === "-"){
				bgcolor = 'text-success';
			}else if(item.simb === "+"){
				bgcolor = 'text-danger';
			}
			
			let str_up = "";
			if(item.difference){
				str_up  = item.difference + ` (`+item.percent+`)`;
			}
			
			strhtml += `<a data-id="`+item.id+`" href="javascript:;" class="list-group-item list-group-item-inverse d-flex justify-content-between align-items-center text-ellipsis">
						<div class="col-6 catalog catalog-left">
						`+item.name+`
						</div>
						<div class="col-6 catalog catalog-right" style="text-align: right;">
							<div>
							<span class="badge">`+item.price+` <i class="fa `+app.getCurrencyIcon()+`" aria-hidden="true"></i></span>						
							</div>	
							<div>
							<span class="badge `+bgcolor+`">`+str_up+`</span>						
							</div>	
						</div>
					</a>`;
		}
		strhtml += '</div>';		
		$('#page-catalog').html(strhtml);
		app.showPage("page-catalog", false);						
		//$('#img').hide();		
	},
	
	buildChart: function(points){	
		
		console.log("points to chart", points);
		console.log(chart);
		
		let pData = [];
		
		for(let i=0; i < points.length; i++){
			pData[i] = [];
			for(let j=0; j < points[i].points.length; j++){
				let p = points[i].points[j];
				console.log(p);
				let dstr = p.y+ '-' +p.m+ '-' +p.d;
				console.log(dstr);
				pData[i].push({
					t: new Date(p.y, p.m, p.d),
					y: p.price
				});
			}
		}
		
		chart.data.datasets[0].data = pData[0];
		chart.update(); // Calling update no				
	},
	
	_getDisplayWidth: function(){
		return $( 'body' ).width();
	},
	
	_translate: function(id){
		
		
		let transl_els = $('#'+id).find('translate');		
		
		$.each(transl_els, function(index, value){
			let tr_path = $(this).data('translate');			
			if(tr_path && data.translates[tr_path] !== undefined){
				$(this).html(data.translates[tr_path]);
			}
		});
	},
	
	_isMenuShowed: function(){
        return this.sideBar !== null && this.sideBar.data('visible') === "1";
    },
	
	getMainPage: function(){
		
		let el = $('#'+this.pageShowed);
		if(!el.length){
			return false;
		}
		let dataMainPage = el.data("depends");
		
		return dataMainPage;
	},
	_hideMenu: function(page_id){
        if(this._isMenuShowed()){
            let left = "-="+this.sidebar_width;
            this.sideBar.data('visible', '');
            this.sideBar.animate({
                left: left,            
            }, 700);
		
            let app = this;
			if(this.pageShowed !== null){
				if(this.pageShowed == page_id || !page_id){
					$('#'+this.pageShowed).animate({
						left: left,
					}, this.pageAnimateSpeed);
				}else{
					$('#'+this.pageShowed).animate({
						left: app._getDisplayWidth(),
					}, this.pageAnimateSpeed);
					this.pageShowed = null;								
					app.showPage(page_id);
					
					
				}
			}
		}else if(page_id){
			app.showPage(page_id);
		}
		return true;
    },
    
    _showMenu: function(){
		
        let sb = this.sideBar;		
        let left = "+="+this.sidebar_width;
        sb.data('visible', '1');
		
        sb.animate({
            left: left,            
        }, 300);
        
		if(this.pageShowed !== null){
			$('#'+this.pageShowed).animate({
				left: left,            
			}, this.pageAnimateSpeed);
		}				        
    },		
	
	exitNotice: function(){
		navigator.notification.confirm(
			data.translates.notification_exit_message, // message
			app.onConfirmExit,            // callback to invoke with index of button pressed
			data.translates.notification_exit_title,           // title
			[
				data.translates.notification_exit_yes,
				data.translates.notification_exit_no
			]     // buttonLabels
		);
	},
	
	onConfirmExit: function(buttonIndex){
		if(buttonIndex == 1){
			navigator.app.exitApp();
		}
	},
	
	onBackKeyDown_callback: function(){
		
		
		if(app._isMenuShowed()){
			app._hideMenu();
			return true;
		}
		
		let mp = app.getMainPage();				
		
		if(mp){
			app.showPage(mp);
			return true;
		}
		
		app.exitNotice();
		
	}
};

app.initialize();

$(document).ready(function(){
	
		
	$( window ).resize(function() {
		
		$.each($('.page'), function(){
			
			if($(this).prop("id") !== app.pageShowed){
				$(this).css({
					left: app._getDisplayWidth(),
					width: app._getDisplayWidth(),
					"min-height": "100%"
				});
			}else{
				$(this).css({width: app._getDisplayWidth(),"min-height": "100%"});
			}
		});
		
		$('#load_back').css({
			width: app._getDisplayWidth(),
		});
	});
	
	
	/* Верхнее меню */
    $('#header-menu-button').click(function(){                      
        app.toggleMenu();               
    });		
	
	
	
	/* Ссылки меню */
	$('#sidebar').on('click', 'li>a', function(){
		let page = $(this).data("page");		
		if(!page){
			return false;
		}		
		
		app.showPage(page);
		
	});
	
	
	/* Вешаем слайдер на дочерние страницы */		
	/*$("#sidebar").swipe({
		swipeStatus:  function(event, phase, direction, distance){
			console.log('swipe');
		},
		
		swipeLeft: function (event, direction, distance, duration, fingerCount) {
			if(app._isMenuShowed()){
				app.toggleMenu();
			}			
		},
	});*/
	
	$(".page, #sidebar").swipe({
		swipeStatus: function(event, phase, direction, distance){
			let el = $(this);
			let depend_id = el.data("depends");
			
			if(direction == "right" && depend_id && !app._isMenuShowed()){
				el.css({
					left: distance
				});
												
				$('#'+depend_id).css({
					left: distance-app._getDisplayWidth()
				});
				
			}
			
			if(direction == "down"){
				if(phase == "cancel"){
					$("#update-div").css({top: 0});
				}
				else if($(this).scrollTop() <= 0 && distance < 60){
					$("#update-div").css({top: distance});
				}
				
				console.log(direction, phase);
			}						
		},
				
		swipeLeft: function (event, direction, distance, duration, fingerCount) {
			if(app._isMenuShowed()){
				app.toggleMenu();
			}
			return false;
		},
		
		swipeRight: function (event, direction, distance, duration, fingerCount) {
						
			let depend_id = $(this).data("depends");
			
			if(app._isMenuShowed()){
				return false;
			}
			
			if(!depend_id){
				app.toggleMenu();
				return false;
			}
			
			if(distance > app._getDisplayWidth()/3){
				$(this).animate({
					left: app._getDisplayWidth(),
				}, app.pageAnimateSpeed, function(){
					//$(this).removeClass('showed');
					//app.showPage(depend_id, false);
				});
				
				if(depend_id){						
					$('#'+depend_id).animate({
						left: 0,
					}, app.pageAnimateSpeed, function(){
						app.pageShowed = depend_id;
					});
				}
			}else{
				$(this).animate({left: 0}, app.pageAnimateSpeed);
				if(depend_id){					
					$('#'+depend_id).animate({
						left: -app._getDisplayWidth(),
					}, app.pageAnimateSpeed);
				}
			}
			return false;

		},
		
		swipeDown: function (event, direction, distance, duration, fingerCount) {			
			
			$("#update-div").css({top: 0});
			
			if($(this).scrollTop() <= 0 && distance >= 60){				
				app.rebuild();
			}
		},
		
		//allowPageScroll:"vertical"
		allowPageScroll:"vertical"
	});
	
});