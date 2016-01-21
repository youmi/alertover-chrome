/**
 *  background.js
 */
var $ = require('jquery');
var io = require('socket.io/node_modules/socket.io-client');

var socket;

var bgScript = window.bgScript = {
    init : function(){
        var pushtoken = localStorage.getItem('pushtoken');
        var alias = localStorage.getItem('alias');
        if(localStorage.getItem('tags')){
            var tags = localStorage.getItem('tags').split(',');
        }

        // connect websocket
        if(pushtoken){
            socket = io.connect('http://test.push.alertover.com');
            socket.on('connect', function() {
                chrome.browserAction.setIcon({'path' : '/imgs/active.png'});
                data = {
                    'pushtoken' : pushtoken,
                    'alias' : alias,
                    'tags' : tags,
                }
                socket.emit('initial', data);
            });

            socket.on('disconnect', function(json) {
                console.log('websocket disconnect');
                chrome.browserAction.setIcon({'path' : '/imgs/default.png'});
            });

            socket.on('system', function(json){
                console.log('system response');
                console.log(json);
            });

            socket.on('message', function(data) {
                var notification = new Notification(data['title'],{
                    title : data['title'],
                    body : data['content'],
                    icon : data['icon']
                });

                chrome.browserAction.getBadgeText({},function(da){
                    da = da?da:0;
                    chrome.browserAction.setBadgeText({
                        text : (parseInt(da)+1).toString(),
                    }); 
                });

            });
        }
    },
    disconnect : function(){
        socket.disconnect(); 
    }
}
bgScript.init();



