// bind all listeners to the doc object model
console.log("message_handle.js accessed");
var form = document.getElementById('message-form');
var messages = document.getElementById('messages');
var socket = io();

form.addEventListener('submit', function(e){
    e.preventDefault();
    var typeMessage = document.getElementById('type-message').value;
    var regex = new RegExp(/[\s]/);
    if (typeMessage != '' && !(typeMessage.length > 50 && regex.test(typeMessage) != true)){
        socket.emit("chat message", typeMessage);
        form.reset();    
    }else{
        console.log("spam");
        socket.emit('spam message', 'Spam detected, message not sent.');
    }
    
});
    
socket.on('chat message', function(msg){
    var newMsg = document.createElement('li');
    console.log(msg.length);
    messages.appendChild(newMsg).innerText = msg;
});
socket.on('spam message', function(msg){
   // handle spam here 
   var newMsg = document.createElement('li');
   console.log("spam detected, message does not meet correct format");
   messages.appendChild(newMsg).innerText = msg;
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