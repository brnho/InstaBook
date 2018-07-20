var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var SALT_FACTOR = 10;

var userSchema = new mongoose.Schema({	
	username: {type: String, required: true, unique: true},
	password: {type: String, required: true},
	posts: [{type: Schema.Types.ObjectId, ref: 'Post'}],
	groups:	[{type: Schema.Types.ObjectId, ref: 'Group'}]
});

userSchema.pre('save', function(done) {
	var user = this; //this refers to the document
	if(!user.isModified('password'))
		return done(); //if only the username was modified

	bcrypt.genSalt(SALT_FACTOR, function(err, salt) { //generate salt for password hashing
		if(err) {
			return done(err);
		}
		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if(err) {
				return done(err);
			}
			user.password = hash;
			done();
		});
	});
});

userSchema.methods.checkPassword = function(guess, cb) {
	bcrypt.compare(guess, this.password, function(err, match) {
		cb(err, match);
	});
};

userSchema.methods.generateJwt = function() {
	var expiry = new Date();
	expiry.setDate(expiry.getDate() + 7); //set the expiration for 7 days

	return jwt.sign({ //create and return a jwt
		_id: this._id,
		username: this.username,
		exp: parseInt(expiry.getTime() / 1000) //?
	}, process.env.JWT_SECRET);
};

var commentSchema = new mongoose.Schema({
	authorName: {type: String, require: true},
	timestamp: {type: Date, "default": Date.now()},
	text: {type: String, required: true},
	avatarUrl: {type: String}
});

var postSchema = new mongoose.Schema({
	authorName: {type: String, require: true},
	timestamp: {type: Date, "default": Date.now()},
	text: {type: String, required: true},
	comments: [commentSchema],
	avatarUrl: {type: String}
});

var groupSchema = new mongoose.Schema({
	members: [{type: Schema.Types.ObjectId, ref: 'User'}],
	posts: [postSchema],
	name: {type: String, required: true, unique: true}
});

mongoose.model('User', userSchema);
mongoose.model('Comment', commentSchema);
mongoose.model('Post', postSchema);
mongoose.model('Group', groupSchema);

