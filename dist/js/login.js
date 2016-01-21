(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var $ = window.$;

$('#loginForm').on('submit', function(e){
    e.preventDefault()
    $.ajax({
        url : 'http://test.api.alertover.com/api/v1/login',
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
                localStorage.setItem('pushtoken', da['data']['pushtoken']);
                localStorage.setItem('uid', da['data']['uid']);
                localStorage.setItem('alias', da['data']['user_id']);
                localStorage.setItem('tags', da['data']['group_ids']);

                // 启动bgPage
                var bg = chrome.extension.getBackgroundPage();
                bg.bgScript.init();
                window.location = '/html/popup.html'; 
            }
            else {
                alert(da['msg']);
            }
        }
    });
});

},{}]},{},[1]);
