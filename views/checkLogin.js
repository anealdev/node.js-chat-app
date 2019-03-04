
 
 $(document).ready(function(){
    $('#submitBtn').prop('disabled', true);
     $('#inputPasswordConfirm').keyup(function () {
       passwordVal = $("#inputPassword").val();
       checkVal = $("#inputPasswordConfirm").val();
       
        if (passwordVal != checkVal || passwordVal == '') {
            $('#submitBtn').prop('disabled', true);
        }else{
           $('#submitBtn').prop('disabled', false); 
        }
    }); 
    
 });