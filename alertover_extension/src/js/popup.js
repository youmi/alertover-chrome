var $ = window.$;
var html5sql = require('./html5sql.js');
var Promise = require('promise');
var Moment = require('moment');

var config = {
    ver : 20,
    dbName : 'alertover.db',
    dbDisplay : 'alertover',
    dbSize : 5*1024*1024,

    getMessagesUrl : 'https://api.alertover.com/api/v1/get_msg',
    loginUrl : 'https://api.alertover.com/api/v1/login',
    update : 'https://api.alertover.com/api/v1/update',

    pageNum : 10
};

// 包装数据库相关方法
var db = (function(){
    html5sql.openDatabase(config['dbName'], config['dbDisplay'], config['dbSize']);
    return {
        query : function(sql){
            return new Promise(function(resolve, reject){
                html5sql.process(
                    sql,
                    function(tr, re){
                        resolve([tr, re]);
                    }, function(error, statement){
                        reject([error, statement]);
                    }
                );
            });
        }
    };
})();

var base = (function(){
    return {
        page    :   1,
        sid     :   'all',
        flat    :   false,

        windowHeight : $(window).height(),
        $content : $('#content'),
        $sourcesUl : $('#sourcesUl'),

        renderSourcesUl : function(results){
            this.$sourcesUl.append('<li class="active"><a class="sourcesItem" data-sid="all" href="#">所有信息</a></li>');
            for(var i=0; i<results.length; i++){
                template = '<li><a class="sourcesItem" data-sid="'+ results[i]['sid'] +'" href="#"><img src="'+ results[i]['source_icon'] +'"/>'+ results[i]['name'] +'</a></li>';
                this.$sourcesUl.append(template);
            }
        },

        renderContent : function(results){
            for(var i=0; i<results.length; i++){
                if(results[i]['priority']){
                    var template = '<div class="media mk-media important-media">';
                } else {
                    var template = '<div class="media mk-media">';
                }
                template += '<div class="media-left"><span class="media-object-wrapper"><img class="media-object" src="'+results[i]['source_icon']+'"></span></div>';
                template += '<div class="media-body"><h4 class="media-heading">'+(results[i]['title']?results[i]['title']:'Alertover')+'</h4><p class="media-datetime">'+ Moment.unix(results[i]['rt']).format('YYYY-MM-DD HH:mm:ss') +'</p>'+results[i]['content'];
                if(results[i]['url']){
                    template += '<p class="media-url"><a target="_black" href="'+ results[i]['url'] +'">详细信息</a></p></div></div>';
                } else {
                    template += '</div></div>';
                }
                this.$content.append(template);
            }
        },

        renderPage : function(pageSelector, fn){
            $('.app-wrapper').addClass('hide');
            $(pageSelector).removeClass('hide');
            if(fn){
                fn();
            }
        }
    }
})();

function scrollHandler(e){
    if(!base.flat){
        base.flat = true;
        var scrollEvent = setTimeout(function(){
            var documentHeight = $(document).height();
            var scrollTop = $(document).scrollTop();
            if(documentHeight-scrollTop-base.windowHeight < 400){
                var offset = base.page*config['pageNum'];
                if(base.sid == 'all'){
                    sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid ORDER BY rt DESC LIMIT "+config['pageNum']+" OFFSET "+offset;
                }
                else {
                    sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid WHERE sources.sid="+ base.sid  +" ORDER BY rt DESC LIMIT "+config['pageNum']+" OFFSET "+offset;
                }
                db.query(sql).then(function(da){
                    if(da[1].rows.length){
                        base.renderContent(da[1].rows);
                        base.page += 1;
                    }
                    if(da[1].rows.length == config['pageNum']){
                        base.flat = false;
                    }
                }, function(err){console.log(err[0]);});
            }
            else {
                base.flat = false;
            }
        }, 500)
    }
}

function changeSourceHandler(e){
    e.preventDefault();

    var $content = $('#content');
    var $sourcesUl = $('#sourcesUl');

    // @转换发送源 初始化相关参数
    base.sid = $(e.target).data('sid');
    base.page = 1;
    base.flat = false;

    if(base.sid == 'all'){
        sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid ORDER BY rt DESC LIMIT "+config['pageNum'];
    }
    else {
        sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid WHERE sources.sid="+ base.sid  +" ORDER BY rt DESC LIMIT "+config['pageNum'];
    }
    console.log(base.sid);
    db.query(sql).then(function(da){
        $content.empty();
        if(da[1].rows.length){
            base.renderContent(da[1].rows);
        }
        if(da[1].rows.length == config['pageNum']){
            base.flat = false;
        }
        base.page += 1;
        $('#sourcesList').collapse('hide');
        $sourcesUl.find('li').removeClass('active');
        activeAttr = '[data-sid="'+ base.sid +'"]';
        $sourcesUl.find(activeAttr).parent('li').addClass('active');
    });
}

function logoutHandler(e){
    e.preventDefault();
    //用户退出 清空数据库
    // 检查并初始化客户端数据库
    localStorage.clear();
    var bg = chrome.extension.getBackgroundPage();
    bg.bgScript.disconnect();
    db.query([
        "DROP TABLE messages;",
        "DROP TABLE sources;"
    ]).then(function(){
        base.renderPage('#loginPage', function(){
            // 初始化参数
            base.page = 1;
            base.sid = 'all';
            base.flat = false;
            base.$content.empty();
            base.$sourcesUl.empty();
            $('#popupPage').off();
            $('#loginPage').on('submit', '#loginForm', loginHandler);
        });
    });
}

function loginHandler(e){
    e.preventDefault()
    $.ajax({
        url : config['loginUrl'],
        method : 'post',
        contentType : 'application/json',
        dataType : 'json',
        data : JSON.stringify({
            email : $('#emailInput').val(),
            password : $('#passwordInput').val()
        }),
        success : function(da){
            if(da.code === 0){
                localStorage.setItem('aosession', da['data']['session']);
                localStorage.setItem('uid', da['data']['uid']);

                // 启动bgPage
                var bg = chrome.extension.getBackgroundPage();
                bg.bgScript.init();
                base.renderPage('#popupPage', function(){
                    $('#loginPage').off();
                    initPopup();
                });
            }
            else {
                alert(da['msg']);
            }
        }
    });
}

function initPopup(){

    var session = localStorage.getItem('aosession');
    var lastUpdate = localStorage.getItem('lastUpdate');
    var now = Moment().unix();
    if(!lastUpdate){
        lastUpdate = Moment().subtract(2, 'days').unix();
        localStorage.setItem('lastUpdate', lastUpdate);
    }

    // 事件绑定
    $(document).on('scroll', scrollHandler);
    $('#popupPage').on('click', '[data-sid]', changeSourceHandler);
    $('#popupPage').on('click', '#logoutBtn', logoutHandler);

    // 检查并初始化客户端数据库
    var createTablesSql = [
        "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, msgid INTEGER UNIQUE, sid INTEGER, title TEXT, content TEXT, url TEXT, rt INTEGER, priority INTEGER);",
        "INSERT OR IGNORE INTO messages VALUES (NULL,0,0,'欢迎使用Alertover','收到这条信息时，你可以通过该设备接收Alertover信息。\n点击下面链接来设置你的账户','https://www.alertover.com',"+ now +",0);",
        "CREATE TABLE IF NOT EXISTS sources (sid INTEGER UNIQUE, name TEXT, source_icon TEXT);",
        "INSERT OR IGNORE INTO sources VALUES (0, 'Alertover', 'https://www.alertover.com/static/imgs/alertover.png');",
    ];
    var pCreateTables = db.query(createTablesSql);

    //获取本地数据库里的信息 并且分页 
    pCreateTables.then(function(da){
        return db.query("SELECT * FROM messages JOIN sources ON messages.sid=sources.sid ORDER BY rt DESC LIMIT "+config['pageNum']);
    }).then(function(da){
        base.renderContent(da[1].rows);
    });
    //获取本地数据库里的信息 渲染sourcelist 
    pCreateTables.then(function(da){
        return db.query("SELECT * FROM sources");
    }).then(function(da){
        base.renderSourcesUl(da[1].rows);
    });

    // 获取最新信息 并写入数据库
    var pGetMessages = new Promise(function(resolve, reject){
        // 获取最新信息 并存到客户端数据库
        $.ajax({
            url : config.getMessagesUrl,
            method : 'get',
            dataType : 'json',
            data : {
                'session' : session,
                'devname' : 'chrome',
                'from' : lastUpdate 
            },
            success : function(da){
                if(da.code === 0 && (da['data'].length > 0)){
                    resolve(da);
                }
                else {
                    reject(da);
                }
            },
            error : function(err){
                reject(err);
            }
        });
    });
    var pSaveMessages = Promise.all([pGetMessages, pCreateTables]).then(function(da){
        var messages = da[0]['data'];
        var sqls = [];
        for(var i=0;i<messages.length;i++){
            sqls.push({
                "sql" : "REPLACE INTO messages VALUES (NULL,?,?,?,?,?,?,?)",
                "data" : [messages[i]['msgid'], messages[i]['sid'], messages[i]['title'], messages[i]['content'], messages[i]['url'], messages[i]['rt'], messages[i]['priority']]
            });
            sqls.push({
                "sql" : "REPLACE INTO sources VALUES (?,?,?)",
                "data" : [messages[i]['sid'], messages[i]['source'], messages[i]['source_icon']]
            });
        }
        return db.query(sqls);
    }, function(err){
        return Promise.reject('没有新增信息');
    });
    var pLoadMessages = pSaveMessages.then(function(){
        //获取本地数据库里的信息 并且分页 
        return db.query("SELECT * FROM messages JOIN sources ON messages.sid=sources.sid ORDER BY messages.rt DESC LIMIT "+config['pageNum']);
    }, function(err){
        console.log(err);
    });
    pLoadMessages.then(function(da){
        results = da[1]['rows'];
        base.$content.empty();
        base.renderContent(results);
        db.query("SELECT * FROM sources").then(function(da){
            base.$sourcesUl.empty();
            base.renderSourcesUl(da[1].rows);
        });
        localStorage.setItem('lastUpdate', da[1]['rows'][0]['rt']);
    }, function(err){
        console.log(err);
    });

    // 检查更新
    $.ajax({
        url : config.update,
        method : 'get',
        data : {
            'platform' : 'chrome',
        },
        success : function(da){
            if(da.code == 0 && (da.data['ver'] > config['ver'])){
                var messageAlert = '<div class="alert alert-danger alert-dismissible message-alert" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><span class="message">'
                messageAlert += '<a target="_blank" href="'+da.data['url']+'">点击获取最新版本的Alertover插件</a>';
                messageAlert += '</span></div>';
                $(messageAlert).insertBefore(base.$content);
            }
        }
    });
}

$(document).ready(function(){
    // 清空角标
    chrome.browserAction.setBadgeText({text : ''}); 

    // @todo support
    if(!(window.openDatabase && window.Notification)){
        $('#defaultMessage').html('<a target="_blank" href="http://www.google.cn/chrome/browser/desktop/index.html">请先更新你的chrome浏览器</a>');
        return;
    }

    var session = localStorage.getItem('aosession');
    if(session){
        base.renderPage('#popupPage', function(){
            initPopup();
        });
    }
    else {
        // 没有登录 请先登录
        // @todo 登录完清除数据库数据
        base.renderPage('#loginPage', function(){
            $('#loginPage').on('submit', '#loginForm', loginHandler);
        });
    }

});
