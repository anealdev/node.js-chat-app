  $("p").click(function(){
    $(this).hide();
  });

console.log("message_handle.js accessed");
var form = document.getElementById('message-form');
var messages = document.getElementById('messages');

var socket = io();
var name = document.getElementById('name').innerText;
var user = name.slice(6);

var $whosOnlineList = $("#whos-online-list");

console.log($whosOnlineList);
window.onload = function(){
    console.log("home page loaded");
    socket.emit('new user', user);
};
form.addEventListener('submit', function(e){
    e.preventDefault();
    var typeMessage = document.getElementById('type-message').value;
    
    var regex = new RegExp(/[\s]/);
    if (typeMessage != '' && !(typeMessage.length > 50 && regex.test(typeMessage) != true)){
        var msg = typeMessage;
        socket.emit("chat message", msg, function(data){
            var newMsg = document.createElement('div');
            newMsg.setAttribute('class', 'error');
            messages.appendChild(newMsg).innerHTML = data;
            
        });
        form.reset();    
    }else{
        console.log("spam");
        socket.emit('spam message', 'Spam detected, message not sent.');
    }
    
});
    
socket.on('chat message', function(bundle){
    console.log("user is " + bundle.username);
    console.log("msg is: " + bundle.msg);
    var newMsg = document.createElement('div');
    var userName = document.createElement('span');
   // userName.setAttribute("class", "username");
    //userName.setAttribute("id", bundle.msg )
    var userMsg = document.createElement('span');
    userMsg.setAttribute("id", "user-msg");
    var spaceBetween = document.createElement('span');
    messages.appendChild(newMsg);
    newMsg.appendChild(userName).innerHTML="<span style: 'color: #00ccff' >" + bundle.username + "</style>";
    newMsg.appendChild(spaceBetween).innerHTML= "   |   " ;
    newMsg.appendChild(userMsg).innerHTML=bundle.msg;
});
socket.on('spam message', function(msg){
   // handle spam here 
   var newMsg = document.createElement('li');
   console.log("spam detected, message does not meet correct format");
   messages.appendChild(newMsg).innerText = msg;
});

socket.on('usernames', function(data){
   console.log("list of usernames: " + data);
   var html='';
   for(var i=0;i<data.length;i++){
       html += data[i] + '<br/>'; //overwrites any existing contents
   }
   $whosOnlineList.html(html);
});

socket.on('private', function(data){
    var newMsg = document.createElement('div');
    newMsg.setAttribute('class', 'private');
    var userName = document.createElement('span');
    var userMsg = document.createElement('span');
    var spaceBetween = document.createElement('span');
    messages.appendChild(newMsg);
    newMsg.appendChild(userName).innerHTML= data.username;
    newMsg.appendChild(spaceBetween).innerHTML= "   |   " ;
    newMsg.appendChild(userMsg).innerHTML=data.msg;
    
})
