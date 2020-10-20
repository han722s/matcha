const express = require("express")
const app = express()
const Users = require("./routes/users")
const Auth = require("./routes/authentification")
const conf = require("./config")
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('express-flash-messages');
var cors = require('cors')
const http = require("http")
const socketio = require("socket.io")
const server = http.createServer(app)
const io = socketio(server)
const cookie = require('cookie');

app.set('view engine', 'ejs');
app.use(cookieParser())
app.use(session({
  secret:'matcha',
  cookie: {
    httpOnly: true,
    },
  resave:false,
  saveUninitialized:false
}));
app.set('trust proxy', true)
app.use(express.static(__dirname + '/public'));
//Handles post requests
var bodyParser = require('body-parser');
//Handles put requests
var methodOverride = require('method-override');
app.use(function(req, res, next) {
    if (req.headers['content-type'] === 'application/json;') {
      req.headers['content-type'] = 'application/json';
    }
    next();
  });
app.use(flash());
 app.use(bodyParser.json())
 app.use(methodOverride())
 app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(Users)
app.use(Auth)
app.use(cors())

/// attaching io instance to app
app.io = io;

users = [];
connections = [];

io.on('connect', socket => {
  if(socket.handshake.headers.cookie)
      var userCookie = cookie.parse(socket.handshake.headers.cookie)
  if(userCookie){
      if(userCookie.user){
          var user = JSON.parse(userCookie.user)
          if(users.indexOf(user.username) == -1){
              users.push(user.username);
              console.log(`user logged: ${user.uuid}`)
              io.emit('users', {connectedUsers: users});
          }
      }
      socket.on('disconnect', function(data){
          if(userCookie.user){
              if(users.indexOf(user.username) != -1){
                  users.splice(users.indexOf(user.username), 1);
                  console.log(`user disconected: ${user.uuid}`)
                  io.emit('users', {connectedUsers: users});
              }
          }
      })
      socket.on('check', function(data){
        console.log("checked")
        io.emit('users', {connectedUsers: users});
    })
  }
})

app.use(function(req, res, next){
  status = 404;
  error = "Seems like this page does not exist anymore !"
  res.render('pages/error',{error , status})
})

server.listen(conf.portNumFront, () => {
    console.log(`Listening on ${conf.portNumFront}`)
})

