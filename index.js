require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT;
const connectInfo = process.env.CONNECT;
const sessionMaxAge = parseInt(process.env.MAXAGE);
const session_name = process.env.NAME;
const IN_PROD = 'production';
const session_secret = process.env.SESSION_SECRET;
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bcryptSaltRounds = 12;
const moment = require('moment');
var user;
//var userList = [];
var userList = {};

mongoose.connect(connectInfo, {
    useNewUrlParser: true
},  function(error){
    if(error){
        console.log(error);
    }else{
        console.log("Connected to the databbase");
}
});

var chatSchema = new mongoose.Schema ({
    username: String,
    msg: String,
    created: {type: Date, default: Date.now()}
});
var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

var User = mongoose.model("User", userSchema); // create a model to use to have a template for each of the documents in the collection
var Chat = mongoose.model("Message", chatSchema);

app.use('/', express.static('views'));

app.set('trust proxy', 1); // trust first proxy, may need to remove this for heroku, set view engine
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true //default already, but must specify. Value can be any type when true
}));

app.use(session({
    name: session_name,
    resave: false,
    saveUninitialized: false,
    secret: session_secret,
    trustProxy: true,
    cookie: {
        maxAge: sessionMaxAge,
        sameSite: true,
        secure: true
    }
}));

const redirectLogin = (req, res, next) => {
    if(!req.session.userId){
        res.redirect('/login');
    }else{
        user = req.session.name;
        next();
    }
};

const redirectHome = (req, res, next) => {
    if(req.session.userId){
        user = req.session.name;
        res.redirect('/home');
    }else{
        next();
    }
};

app.get('/', (req, res) => {
    const { userId } = req.session;
    //const userId = 1;
    // ${} means insert this into string
    res.send(`
    <h1>Welcome!</h1>
    ${userId ? `
    
    <a href="/">Home</a>
    <form method="post" action="/logout">
        <button>Logout</button>
    </form>
    ` : `
    <a href="/login">Login</a>
    <a href="/register">Register</a>
    `}
    `);
});

app.get('/home', redirectLogin, (req, res) => {
     res.render('home', { name: req.session.name}); 
});

app.get('/login', redirectHome, (req, res) => { // have a login html file for this
    res.render('login');
});

app.get('/register', redirectHome, (req, res) => {
    res.render('register', { error: req.session.error});
    
});

app.post('/login', redirectHome, (req, res) => {
    const { email, password } = req.body;
    if(email && password){
        User.find({email: email}, function(error, data){
            if(error){
                console.log(error);
            }if(data[0] !== undefined){
            // decrypt and confirm password
            
            var match = bcrypt.compareSync(password ,data[0].password);
            
                if(match === true){
                    req.session.userId = data[0]._id;
                    req.session.name = data[0].name;
                
                return res.redirect('/home');
                }else{
                    
                    res.redirect('/login');     
                }
            }else{
                
                res.redirect('/login'); 
            }
                
            });
  }});

app.post('/register', redirectHome, (req, res) => {
    const { name, email, password } = req.body;
    User.find({email: email}, function(error, data){
       
        if(error){
           console.log(error);
           return;
        }
        if(data.length > 0){ // email already exists in database
           req.session.error = "Email already registered";
           res.render('register', { error: "Email already registered"}); 
        }
        else if(data.length == 0){ // if email not found
            bcrypt.hash(password, bcryptSaltRounds)
            .then(function(hashedPassword){
                User.create({
                name: name,
                email: email,
                password: hashedPassword
            })
            .then(function(){
                User.find({email: email}, function(error, data){
           if(error){
               console.log(error);
           }
            req.session.userId = data[0]._id;
            req.session.name = data[0].name;
            return res.redirect('/home');
        })
        .catch(function(error){
            console.log("Error with registration");
            console.log(error);
            
        });
            });
            });
            // hash the passwords for real site
            
            
        }else{
            return res.redirect('/register');
        }
        
        }
)});

app.get('/logout', redirectLogin, (req, res) => { //fix this
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/home');
            
        }
        res.clearCookie(session_name);
        res.redirect('/login');
    });
});

io.on('connection', function(socket){
    
    var query = Chat.find({});
    query.sort('-created').limit(10).exec(function(err, docs){
        if(err){
            throw err;
        }
      
        socket.emit('load old msg', docs);
    });
    
    function updateUserList(){
        io.emit('usernames', Object.keys(userList)); // returns an array of a given object's own property names, in the same order as we get with a normal loop
    }
 
  socket.on('chat message', function(data, callback){
     var msg = data.trim();
     if(msg.substr(0,3) === '/p '){
         console.log("private message");
         var msg = msg.substr(3);
         var ind = msg.indexOf(' ');
         if(ind !== -1){
             var name = msg.substring(0, ind);
             var msg = msg.substring(ind + 1);
             if(name in userList){
                // display message to sender and private recipient only
                 userList[name].emit('private', {msg: msg, username: socket.username} );
                 socket.emit('private', {msg: msg, username: socket.username} );
                  
             }else{
                 callback('Error! User not online.');
             }
            
         }else{
             callback('Error! Please follow the format for sending a private message.');
         }
     }else{
        var newMsg = new Chat({msg: msg, username: socket.username});
        console.log("chat msg from " + socket.username );
       
        newMsg.save(function(err){
            if(err){
                throw err;
            }
            io.emit('chat message', {msg: data, username: socket.username, created: newMsg.created} ); 
        });
        
     }
  });
 
  socket.on('spam message', function(msg){
     console.log(msg);
     socket.emit('spam message', 'Spam detected, incorrect format.');
  });
  
  socket.on('new user', function(data){
     if(!(data in userList)){
         console.log("new user, not in userList");
         socket.username = data;
         userList[socket.username] = socket;
         updateUserList();
     } 
  });
  
  socket.on('disconnect', function(data){
      if(!socket.username){
        return;  
      }
      delete userList[socket.username];
      updateUserList();
  });

});
 
http.listen(port, function(){
    console.log("listening on specified port");
})