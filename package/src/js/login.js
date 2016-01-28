var $ = window.$;

var config = {
    loginUrl : 'https://api.alertover.com/api/v1/login',
};

$('#loginForm').on('submit', function(e){
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
                window.location = '/html/popup.html'; 
            }
            else {
                alert(da['msg']);
            }
        }
    });
});
