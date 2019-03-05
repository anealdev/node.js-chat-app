
 var form = document.getElementById('message-form');
 var messages = document.getElementById('messages');
 var chat_area = document.getElementById('chat-area');


 var socket = io();
 var name = document.getElementById('name').innerText;
 var user = name.slice(6);
 var whosOnlineList = document.getElementById('whosOnlineList');
 var $whosOnlineList = $("#whosOnlineList");

 function displayModal(e) {
   var $private_modal = $("#private_modal");
   var $private_modal_content = $("#private_modal_content");
   var $close = $("#close");
   ("displayModul");
 }

 function bottomScroll() {
   chat_area.scrollTop = chat_area.scrollHeight;
   return;
 }

 window.onload = function() {
   ("home page loaded");
   socket.emit('new user', user);
 };

 form.addEventListener('submit', function(e) {
   e.preventDefault();
   var typeMessage = document.getElementById('type-message').value;

   var regex = new RegExp(/[\s]/);
   if (typeMessage != '' && !(typeMessage.length > 50 && regex.test(typeMessage) != true)) {
     var msg = typeMessage;
     socket.emit("chat message", msg, function(data) {
       var newMsg = document.createElement('div');
       newMsg.setAttribute('class', 'error');
       messages.appendChild(newMsg).innerHTML = data;

     });
     form.reset();
   } else {
     ("spam");
     socket.emit('spam message', 'Spam detected, message not sent.');
   }

 });

 socket.on('chat message', function(data) {
   displayMsg(data);

 });
 socket.on('spam message', function(msg) {
   // handle spam here 
   var newMsg = document.createElement('div');
   ("spam detected, message does not meet correct format");
   messages.appendChild(newMsg).innerText = msg;
 });

 socket.on('usernames', function(data) {
   ("list of usernames: " + data);
   var html = '';
   for (var i = 0; i < data.length; i++) {
     html += '<li class="whos-online-user" id=' + data[i] + '>' + data[i] + '<br/>'; //overwrites any existing contents
   }
   $whosOnlineList.html(html);
 });

 socket.on('private', function(data) {
   var date = new Date();
   var dateTime = date.toLocaleDateString() + " " + date.toLocaleTimeString() + "  (private)";
   var newMsg = document.createElement('div');
   newMsg.setAttribute('class', 'private');
   var when = document.createElement('span');
   when.setAttribute("class", "date");
   var userName = document.createElement('span');
   var userMsg = document.createElement('span');
   var spaceBetween = document.createElement('span');
   messages.appendChild(newMsg);
   newMsg.appendChild(when).innerHTML = dateTime + "<br>";
   newMsg.appendChild(userName).innerHTML = data.username;
   newMsg.appendChild(spaceBetween).innerHTML = "   :   ";
   newMsg.appendChild(userMsg).innerHTML = data.msg;
   bottomScroll();
 });

 socket.on('load old msg', function(docs) {
   ("displaying old messages!");
   for (var i = docs.length - 1; i >= 0; i--) {
     //for(var i=0; i<docs.length;i++){
     displayMsg(docs[i]);
   }

 });

 function displayMsg(data) {
   var date = new Date(data.created);
   var dateTime = date.toLocaleDateString() + " " + date.toLocaleTimeString();

   var newMsg = document.createElement('div');
   var when = document.createElement('span');
   //var brk = document.createElement('br');
   when.setAttribute("class", "date");
   newMsg.setAttribute("class", "newMsg");
   var userName = document.createElement('span');
   userName.setAttribute("id", "msgUsername");
   var userMsg = document.createElement('span');
   userMsg.setAttribute("class", "user-msg");
   var spaceBetween = document.createElement('span');
   messages.appendChild(newMsg);
   newMsg.appendChild(when).innerHTML = dateTime + "<br>";
   newMsg.appendChild(userName).innerHTML = data.username;
   newMsg.appendChild(spaceBetween).innerHTML = "   :   ";
   newMsg.appendChild(userMsg).innerHTML = data.msg;
   bottomScroll();
 }
