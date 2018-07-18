var mongoose = require('mongoose');
var dbURI = 'mongodb://localhost:27017/test';
if (process.env.NODE_ENV === 'production') {
	dbURI = process.env.MONGODB_URI; //retrieve from heroku
}
mongoose.connect(dbURI);

//event listeners (must come before the termination code)
mongoose.connection.on('connected', function() {
	console.log("Mongoose connected to " + dbURI);
});

mongoose.connection.on('error', function(err) {
	console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function() {
	console.log('Mongoose disconnected');
});

//reusable shutdown function
var shutdown = function(msg, callback) {
	mongoose.connection.close(function() {
		console.log('Mongoose disconnected through ' + msg);
		callback(); 
	});
};

//listen for node termination signals
process.once('SIGUSR@2', function() {
	shutdown('nodemon restart', function() { 
		process.kill(process.pid, 'SIGUSR2');
		//notice how process.kill is enclosed in an anonymous function!
	});
});

process.on('SIGINT', function() {
	shutdown('app termination', function() {
		process.exit(0);
	});
});

process.on('SIGTERM', function() {
	shutdown('Heroku app termination', function() {
		process.exit(0);
	});
});

require('./models');