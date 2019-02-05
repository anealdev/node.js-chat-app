// bind all listeners to the doc object model
console.log("message_handle.js accessed");
var form = document.getElementById('message-form');
var messages = document.getElementById('messages');
var whosOnline = document.getElementById('whos-online-list');
var socket = io();
var user;

form.addEventListener('submit', function(e){
    e.preventDefault();
    var typeMessage = document.getElementById('type-message').value;
    var name = document.getElementById('name').innerText;
    user = name.slice(6);
    var regex = new RegExp(/[\s]/);
    if (typeMessage != '' && !(typeMessage.length > 50 && regex.test(typeMessage) != true)){
        var bundle = [user, typeMessage];
        socket.emit("chat message", bundle);
        form.reset();    
    }else{
        console.log("spam");
        socket.emit('spam message', 'Spam detected, message not sent.');
    }
    
});
    
socket.on('chat message', function(bundle){
    var newMsg = document.createElement('div');
    var userName = document.createElement('span');
    userName.setAttribute("id", "username");
    var userMsg = document.createElement('span');
    userMsg.setAttribute("id", "user-msg");
    var spaceBetween = document.createElement('span');
    messages.appendChild(newMsg);
    newMsg.appendChild(userName).innerHTML="<span style: 'color: #00ccff' >" + bundle[0] + "</style>";
    newMsg.appendChild(spaceBetween).innerHTML= "   |   " ;
    newMsg.appendChild(userMsg).innerHTML=bundle[1];
});
socket.on('spam message', function(msg){
   // handle spam here 
   var newMsg = document.createElement('li');
   console.log("spam detected, message does not meet correct format");
   messages.appendChild(newMsg).innerText = msg;
});

socket.on('disconnect event', function(msg){
   //console.log(userList.length);
   //for(var i=0;i<userList.length-1;i++){
   //var newUser = document.createElement('li');
   //whosOnline.appendChild(newUser).innerHTML=userList[i][1];
   //}
   console.log("REMOVED" + msg.customEvent);
});

/*
$(function(){
    var socket = io();
    $('form').submit(function(event){
    console.log("message submitted");
    event.preventDefault();
    socket.emit("chat message", $('#type-message').val());
    $('#type-message').val('');
    return false;
});
});
*/