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
require('./app_api/models/db'); //hook up the database, now mongoose is configured

var routesAPI = require('./app_api/routes/index');
var setUpPassport = require('./setuppassport');

var app = express();

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

app.use(function(err, rea, res, next) {
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
