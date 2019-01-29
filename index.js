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
    console.log("checking redirectLogin " + req.session.userId);
    if(!req.session.userId){
        res.redirect('/login')
    }else{
        next()
    }
}

const redirectHome = (req, res, next) => {
    console.log("checking redirectHome " + req.session.userId);
    if(req.session.userId){
        res.redirect('/home')
    }else{
        next()
    }
}

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
    console.log("home: " + req.session.userId);
    res.render('home', { name: req.session.name}); 
  // get user id here to send to home page
 /* User.find({_id: req.session.userId}, function(error, data){
      var name = data[0].name;
      res.render('home', { name: name});  
  });
  */
});

/*app.get('/home', redirectLogin, (req, res) => {
    const user = users.find(user => user.id === req.session.userId);
    
    console.log('home page');
    const { userId } = req.session;
    //const userId = 1;
    res.sendFile(__dirname + '/static/home.html');
    });
*/

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
        User.find({email: email,password: password}, 'name', function(error, data){
            if(error){
                console.log(error);
            }if(data[0] !== undefined){
            console.log("data: " + data);
            console.log("user verified");
            req.session.userId = data[0]._id;
            req.session.name = data[0].name;
            console.log('Name: ' + data);
            return res.redirect('/home');
            }else{
                console.log("no match, redirecting login");
                res.redirect('/login'); 
            }
                
            });
   /*if(user){
        req.session.userId = user.id;
        console.log(req.session.userId + " redirecting home");
        return res.redirect('/home');
    }
        
    } */
    
}});

app.post('/register', redirectHome, (req, res) => {
    const { name, email, password } = req.body;
    var emailFound = false;
    User.find({email: email}, function(error, data){
        if(error){
            console.log(error);
            return;
        }
        if(data.length == 0){
            console.log("Email available");
            // hash the passwords for real site
            User.create({
                name: name,
                email: email,
                password: password
            });
            
        }else{
            return res.redirect('/register');
        }
        User.find({email: email}, function(error, data){
           if(error){
               console.log(error);
           }
            req.session.userId = data[0]._id;
            req.session.name = data[0].name;
            return res.redirect('/home');
        });
        }
)});

app.post('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/home');
            
        }
        res.clearCookie(session_name);
        res.redirect('/login');
    });
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

http.listen(port, function(){
    console.log("listening on specified port");
})