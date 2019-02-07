require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT;
const sessionMaxAge = parseInt(process.env.MAXAGE);
const session_name = process.env.NAME;
const IN_PROD = 'production';
const session_secret = process.env.SESSION_SECRET;
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bcryptSaltRounds = 12;
var user;
var userList = [];
var chat_messages = [];

mongoose.connect('mongodb://velma:&inkies101@ds115595.mlab.com:15595/chat', {
    useNewUrlParser: true
},  function(error){
    if(error){
        console.log(error);
    }else{
        console.log("Connected to the databbase");
}
});

var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

var User = mongoose.model("User", userSchema); // create a model to use to have a template for each of the documents in the collection

app.use('/', express.static('views'));
//app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // trust first proxy, may need to remove this for heroku, set view engine
app.set('view engine', 'ejs');

/*const users = [
    { id: 1, name: 'Alex', email: 'alex@gmail.com', password: 'secret' }, 
    { id: 2, name: 'Penelope', email: 'penelope@gmail.com', password: 'secret' }, 
    { id: 3, name: 'Hugo', email: 'hugo@gmail.com', password: 'secret' }
];*/

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
    res.send(`
        <h1>Login</h1>
        <form method='post' action='/login'>
            <input type='email' name='email' placeholder='Email' required />
            <input type='password' name='password' placeholder='Password' require />
            <input type='submit' value='Submit' />
            </form>
        <a href="/register">Register</a>
        `)
});

app.get('/register', redirectHome, (req, res) => {
    res.send(`
        <h1>Register</h1>
        <form method='post' action='/register'>
            <input name='name' placeholder='Name' required />
            <input type='email' name='email' placeholder='Email' required />
            <input type='password' name='password' placeholder='Password' require />
            <input type='submit' value='Submit' />
            </form>
            <a href="/login">Login</a>
    `);
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
        if(data.length == 0){
            
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
    console.log("User is connected: " + socket.id +" " + user);
    
    function updateUserList(){
        io.emit('usernames', userList);
    }
 
  socket.on('chat message', function(data){
     //var bundle = [data[0],data[1]];
     console.log("user sending message: " + socket.username);
     console.log("data")
     io.emit('chat message', {msg: data, username: socket.username} ); 
  });
 
  socket.on('spam message', function(msg){
     console.log(msg);
     socket.emit('spam message', 'Spam detected, incorrect format.');
  });
  
  socket.on('new user', function(data){
     console.log("checking list " + userList.indexOf(data));
     if(userList.indexOf(data) === -1){
         console.log('username does not exist yet');
         socket.username = data;
         userList.push(socket.username);
         updateUserList();
     } 
  });
  
  socket.on('disconnect', function(data){
      if(!socket.username){
        return;  
      }
      userList.splice(userList.indexOf(socket.username), 1);
      updateUserList();
  });

});
 
http.listen(port, function(){
    console.log("listening on specified port");
})