var $ = require('jquery');
var io = require('socket.io/node_modules/socket.io-client');
var Promise = require('promise');
var Moment = require('moment');
var socket;

var base = (function(){
    var getPushtokenUrl = 'https://api.alertover.com/api/v1/get_pushtoken'; 
    var getGroupIds = 'https://api.alertover.com/api/v1/get_group_ids'; 

    return {
        pushSocketUrl : 'http://push.alertover.com',

        getPushtoken : function(session){
            return new Promise(function(resolve, reject){
                $.ajax({
                    url : getPushtokenUrl,
                    method : 'get',
                    data : {
                        'session' : session,
                    },
                    success : function(da){
                        if(da.code === 0){
                            resolve(da['data']);
                        }
                        else {
                            reject(da['msg']);
                        }
                    },
                    error : function(err){
                        reject('接口出错');
                    }
                });
            });
        },

        getGroupIds : function(session){
            return new Promise(function(resolve, reject){
                $.ajax({
                    url : getGroupIds,
                    method : 'get',
                    data : {
                        'session' : session,
                    },
                    success : function(da){
                        if(da.code === 0){
                            resolve(da['data']);
                        }
                        else {
                            reject(da['msg']);
                        }
                    },
                    error : function(err){
                        reject('接口出错');
                    }
                });
            });
        }
    };
})();

var bgScript = window.bgScript = {
    init : function(){
        chrome.browserAction.setIcon({'path' : '/imgs/unactive.png'});
        var pushtoken = localStorage.getItem('pushtoken');
        var expired = localStorage.getItem('expired');
        var session = localStorage.getItem('aosession');
        var now = Moment().unix();

        // 没有登录
        if(!session){
            return;
        }

        if(!pushtoken || !expired || (now > expired)){
            base.getPushtoken(session).then(function(da){
                localStorage.setItem('pushtoken', da['pushtoken']);
                localStorage.setItem('expired', da['expired']);
                bgScript.connect();
            },function(){
                console.log('接口出错');
            });
        }
        else {
            bgScript.connect();
        }
    },

    connect : function(){
        var pushtoken = localStorage.getItem('pushtoken');
        var session = localStorage.getItem('aosession');
        socket = io.connect(base.pushSocketUrl);

        socket.on('connect', function() {
            base.getGroupIds(session).then(function(da){
                user_detail = da;
                var tags = [];
                for (i in da['group_ids']){
                    tags.push(da['group_ids'][i].split('-').join(''))
                }
                data = {
                    'pushtoken' : pushtoken,
                    'alias' : da['user_id'].split('-').join(''),
                    'tags' : tags
                };
                chrome.browserAction.setIcon({'path' : '/imgs/active.png'});
                socket.emit('initial', data);
            });
        });

        socket.on('disconnect', function(json) {
            console.log('websocket disconnect');
            chrome.browserAction.setIcon({'path' : '/imgs/unactive.png'});
        });

        socket.on('message', function(data) {
            var notification = new Notification(data['title'],{
                title : data['title'],
                body : data['content'],
                icon : data['icon']
            });
            
            var link = data['extra']['url'];
            if (link) { 
                notification.onclick = function() {
                    window.open(link);
                }
            }
            
            chrome.browserAction.getBadgeText({},function(da){
                da = da?da:0;
                chrome.browserAction.setBadgeText({
                    text : (parseInt(da)+1).toString(),
                }); 
            });
        });

        socket.on('transparent', function(data){
            switch(data['operation']){
                case 'join_tag':
                    socket.emit('join_tag', data['tag'])
                    break;
                case 'leave_tag':
                    socket.emit('leave_tag', data['tag'])
                    break;
                default:
                    console.log('error');
            }
        });
    },

    disconnect : function(){
        socket.disconnect(); 
    }
}

bgScript.init();
