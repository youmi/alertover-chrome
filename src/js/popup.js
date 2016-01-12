$(document).ready(function(){
    session = localStorage.getItem('aosession');
    if(!session){
       window.location = '/html/login.html'; 
       retrun;
    }
    $.ajax({
        url : 'http://test.api.alertover.com/api/v1/get_msg',
        method : 'get',
        dataType : 'json',
        data : {
            'session' : session,
            'devname' : 'chrome',
            'from' : 1442453910 
        },
        success : function(da){
            if(da.code === 0){
                console.log('success');
                for(var i=0; i<da.data.length; i++){
                    $('#content').append($('<p>'+da.data[i]['content']+'</p>'));
                }
            }
            else {
                if(da.code === -1004 || da.code === -1005){
                    localStorage.removeItem('aosession');
                    window.location = '/html/login.html'; 
                    return;
                }
                alert(da['msg']);
            }
        }
    });

    var bg = chrome.extension.getBackgroundPage();
});
