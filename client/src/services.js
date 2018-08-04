import * as jwt from 'jsonwebtoken';
var md5 = require('js-md5');

var saveToken = function(token, cb) {
	window.localStorage['token'] = token;
	if(window.localStorage['token']) {
		cb(); //is this the right way to do this
	}
};

var getToken = function() {
	return window.localStorage['token'];
};

var logout = function() {
	window.localStorage.removeItem('token');
}

var isLoggedIn = function() {

	var token = getToken();
	if(token) {		
		var result;
		jwt.verify(token, process.env.REACT_APP_JWT_SECRET, function(err, decoded) {
			if(err) {
				result = false;
			} else {
				result = (decoded.exp > Date.now() / 1000); //can't return directly from within this cb...
			}
		});
		if(result) return result;
	} else {
		return false;
	}
};

var currentUser = function() {
	if(isLoggedIn()) {
		var token = getToken();
		var username;
		jwt.verify(token, process.env.REACT_APP_JWT_SECRET, function(err, decoded) {
			if(err) throw err; //need to handle this better
			username = decoded.username;			
		})
		if(username) return username;
	}
};

var userId = function() {
	if(isLoggedIn()) {
		var token = getToken();
		var id;
		jwt.verify(token, process.env.REACT_APP_JWT_SECRET, function(err, decoded) {
			if(err) throw err; //need to handle this better
			id = decoded._id;
		})
		if(id) return id;
	}
};

//mongoose stores dates as ISO date objects, but returns them as strings
var formatDate = function(dateString) {
	var date = new Date(dateString);
	var monthNames = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"];
	var d = date.getDate();
	var m = monthNames[date.getMonth()];
	var y = date.getFullYear();
	var output = d + ' ' + m + ' ' + y;
	return output;
};

var createToken = function() {
	if(isLoggedIn()) {
		var id = userId();
		if(id) { //async
			/*encrypt user id for the jwt payload
			var cipher = crypto.createCipher('aes-256-ctr', process.env.REACT_APP_JWT_SECRET);
			var crypted = cipher.update(id, 'utf8', 'hex');
			crypted += cipher.final('hex');
			*/
			var expiry = new Date();
			expiry.setDate(expiry.getDate() + 0.00138); //two minutes from now
			var token = jwt.sign({
				userId: id,
				exp: parseInt(expiry.getTime() / 1000)
			}, process.env.REACT_APP_JWT_SECRET);		
			return(token);
		}
	}
}

var avatar = (username, size) => {	
	var hash = md5(username);
	return 'https://www.gravatar.com/avatar/' + hash + '?d=retro&s=' + size;
};

export { saveToken, getToken, isLoggedIn, currentUser, logout, formatDate, userId, createToken, avatar };