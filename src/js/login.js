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
                console.log('success');
                localStorage.setItem('aosession', da['data']['session']);
                window.location = '/html/popup.html'; 
            }
            else {
                alert(da['msg']);
            }
        }
    });
});
