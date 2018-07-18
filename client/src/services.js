var saveToken = function(token) {
	window.localStorage['token'] = token;
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
		var payload = JSON.parse(window.atob(token.split('.')[1])); //atob decodes a 64 bit string
		return payload.exp > Date.now() / 1000; //why divide by 1000?
	} else {
		return false;
	}
};

var currentUser = function() {
	if(isLoggedIn()) {
		var token = getToken();
		var payload = JSON.parse(window.atob(token.split('.')[1]));
		return payload.username;
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


export { saveToken, getToken, isLoggedIn, currentUser, logout, formatDate };