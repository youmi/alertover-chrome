var $ = window.$;
var html5sql = require('./html5sql.js');
var Promise = require('promise');
var Moment = require('moment');

var config = {
    dbName : 'alertover.db',
    dbDisplay : 'alertover',
    dbSize : 5*1024*1024,
    getMessagesUrl : 'https://api.alertover.com/api/v1/get_msg',
    pageNum : 10
};

var db = (function(){
    html5sql.openDatabase(config['dbName'], config['dbDisplay'], config['dbSize']);
    return {
        query : function(sql){
            return new Promise(function(resolve, reject){
                html5sql.process(
                    sql,
                    function(tr, re){
                        console.log(tr);
                        console.log(re);
                        resolve([tr, re]);
                    }, function(error, statement){
                        console.log(error.message);
                        console.log(statement);
                        reject([error, statement]);
                    }
                );
            });
        }
    };
})();

var base = (function(){
    var $content = $('#content'),
        $sourcesUl = $('#sourcesUl'),
        windowHeight = $(window).height(),
        flat = false;

    return {
        page    :   1,
        sid     :   'all',

        renderSourcesUl : function(results){
            $sourcesUl.append('<li class="active"><a class="sourcesItem" data-sid="all" href="#">所有信息</a></li>');
            for(var i=0; i<results.length; i++){
                template = '<li><a class="sourcesItem" data-sid="'+ results[i]['sid'] +'" href="#"><img src="'+ results[i]['source_icon'] +'"/>'+ results[i]['name'] +'</a></li>';
                $sourcesUl.append(template);
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
                $content.append(template);
            }
        },

        scrollHandler : function(e){
            if(!flat){
                flat = true;
                var scrollEvent = setTimeout(function(){
                    var documentHeight = $(document).height();
                    var scrollTop = $(document).scrollTop();
                    if(documentHeight-scrollTop-windowHeight < 400){
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
                                flat = false;
                            }
                        }, function(err){console.log(err[0]);});
                    }
                    else {
                        flat = false;
                    }
                }, 500)
            }
        },

        changeSourceHandler : function(e){
            e.preventDefault();

            // @转换发送源 初始化相关参数
            base.sid = $(e.target).data('sid');
            base.page = 1;
            flat = false;

            if(base.sid == 'all'){
                sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid ORDER BY rt DESC LIMIT "+config['pageNum'];
            }
            else {
                sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid WHERE sources.sid="+ base.sid  +" ORDER BY rt DESC LIMIT "+config['pageNum'];
            }
            db.query(sql).then(function(da){
                $content.empty();
                if(da[1].rows.length){
                    base.renderContent(da[1].rows);
                }
                if(da[1].rows.length == config['pageNum']){
                    flat = false;
                }
                base.page += 1;
                $('#sourcesList').collapse('hide');
                $sourcesUl.find('li').removeClass('active');
                activeAttr = '[data-sid="'+ base.sid +'"]';
                $sourcesUl.find(activeAttr).parent('li').addClass('active');
            });
        },

        logoutHandler : function(e){
            e.preventDefault();
            if(confirm('确定要退出Alertover？')){
                //用户退出 清空数据库
                // 检查并初始化客户端数据库
                db.query([
                    "DROP TABLE messages;",
                    "DROP TABLE sources;"
                ]);
                localStorage.clear();
                var bg = chrome.extension.getBackgroundPage();
                bg.bgScript.disconnect();
                window.location = '/html/login.html'; 
            }
        }
    }
})();

$(document).ready(function(){
    chrome.browserAction.setBadgeText({text : ''}); 

    var session = localStorage.getItem('aosession');
    var lastUpdate = localStorage.getItem('lastUpdate');
    var now = Moment().unix();
    if(!lastUpdate){
        lastUpdate = Moment().subtract(2, 'days').unix();
        localStorage.setItem('lastUpdate', lastUpdate);
    }

    if(!session){
        // 没有登录 请先登录
        // @todo 登录完清除数据库数据
        window.location = '/html/login.html'; 
        return;
    }

    // 事件绑定
    $(document).on('scroll', base.scrollHandler);
    $('#sourcesUl').on('click', '[data-sid]', base.changeSourceHandler);
    $('#logoutBtn').on('click', base.logoutHandler);

    // 检查并初始化客户端数据库
    var createTablesSql = [
        "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, msgid INTEGER UNIQUE, sid INTEGER, title TEXT, content TEXT, url TEXT, rt INTEGER, priority INTEGER);",
        "INSERT OR IGNORE INTO messages VALUES (NULL,0,0,'欢迎使用Alertover','收到这条信息时，你可以通过该设备接收Alertover信息。\n点击下面链接来设置你的账户','https://www.alertover.com',"+ now +",0);",
        "CREATE TABLE IF NOT EXISTS sources (sid INTEGER UNIQUE, name TEXT, source_icon TEXT);",
        "INSERT OR IGNORE INTO sources VALUES (0, 'Alertover', 'http://172.16.5.61/static/imgs/alertover.png');",
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
        $('#content').empty();
        base.renderContent(results);
        db.query("SELECT * FROM sources").then(function(da){
            $('#sourcesUl').empty();
            base.renderSourcesUl(da[1].rows);
        });
        localStorage.setItem('lastUpdate', da[1]['rows'][0]['rt']);
    }, function(err){
        console.log(err);
    });
});
