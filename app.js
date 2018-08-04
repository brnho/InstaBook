require('dotenv').load();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require("express-session");
var flash = require("connect-flash"); 
var passport = require('passport');
var mailer = require('express-mailer');
var jsonwebtoken = require('jsonwebtoken');
var expressjwt = require('express-jwt');
var helmet = require('helmet');
var enforceSSL = require('express-enforces-ssl');
var Pusher = require('pusher');
var cors = require('cors');
require('./app_api/models/db'); //hook up the database, now mongoose is configured

var server = "http://localhost:3000"; //WILL NEED TO CONFIGURE THIS LATER

var app = express();

app.use(cors()); 

//app.use(helmet()); //does this work with api??
//app.enable('trust proxy');
//app.use(enforceSSL());

var pusher = new Pusher({
  appId: '566577',
  key: '2b2939f10640a8221ae9',
  secret: '6bdd6b3da409b363b266',
  cluster: 'us2'
});

pusher.trigger('my-channel', 'my-event', {"message": "hello world"});

var routesAPI = require('./app_api/routes/index');
var setUpPassport = require('./setuppassport');

//email setup
mailer.extend(app, {
  from: 'no-reply@example.com',
  host: 'smtp.googlemail.com',
  secureConnection: true,
  port: 465, //465 for SSL, 587 for TLS
  transportMethod: 'SMTP',  
  auth: {
    user: 'brian.ho501@gmail.com', //it seems the '.' is important
    pass: process.env.EMAIL_PASSWORD
  }
});

setUpPassport();

//views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: "super_secure_password",
	resave: true,
	saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

//router middleware
app.use('/api', routesAPI);


//send email with link to group invitation
var auth = expressjwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'payload' //define property on req to be payload
});

app.post('/groupInvite', auth, function(req, res, next) {
  if(!req.body.groupId || !req.body.email || !req.body.groupName)
    return(res.status(404).json({"message": "missing info"}));

  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 3); //set the expiration for 3 days

  var token = jsonwebtoken.sign({ //create and return a jwt
    groupId: req.body.groupId,
    groupName: req.body.groupName,
    exp: parseInt(expiry.getTime() / 1000) //? 1000 bc its in miliseconds
  }, process.env.JWT_SECRET);

  app.mailer.send('email', {
    to: req.body.email,
    subject: 'Group Invitation', 
    link: server + '/groupInvite/' + token //passed as a local variable to template   
  }, function(err) {
    if(err) {
      console.log(err);
      res.status(400).json({ "message": "error sending email" });
      return;
    }
    res.status(200).json();
  });
});

app.use(function(err, req, res, next) {
  if(err.name === 'UnauthorizedError') { //error thrown by express-jwt
    res.status(401).json({ "message": err.name + ": " + err.message});
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {title: 'Error'});
});

module.exports = app;
