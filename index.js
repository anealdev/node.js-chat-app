var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/', express.static('views'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/index.html');
});

io.on('connection', function(socket){
    console.log("User connected: " + socket.id);
  socket.on('chat message', function(msg){
     io.emit('chat message', msg); 
  });
  socket.on('spam message', function(msg){
     console.log(msg);
     socket.emit('spam message', 'Spam detected, incorrect format.');
  });
});

http.listen(8080, function(){
    console.log("listening on 8080");
})