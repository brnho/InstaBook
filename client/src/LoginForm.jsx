import React, { Component } from 'react';
import SignUpForm from './SignUpForm.jsx';
import { saveToken, currentUser, userId, getToken } from './services';

class LoginForm extends Component {
	constructor(props) {
		super(props);
		this.form = React.createRef();
	}

	state = {
		username: '',
		password: '',
		errors: {
			username: false,
			password: false,
			submit: false
		},
		disabled: false,	
		width: '',
		height: ''	
	};	

	componentDidMount() {
		this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions);
    }

    updateDimensions = () => {
    	this.setState({
    		width: window.innerWidth,
    		height: window.innerHeight
    	});
    }

	handleChange = (event) => {
		var field = event.target.name;
		var value = event.target.value;
		this.setState((prevState) => {
			prevState[field] = value;
			return prevState;
		});
	};

	validateInput = (username, password) => {
		var errors = {};
		if(!username) {
			errors.username = 'Username required';
		}
		if(!password) {
			errors.password = 'Password required';
		}
		return errors;
	};	

	handleSubmit = (event) => {
		event.preventDefault();		
		//perform validation
		var errors = this.validateInput(this.state.username, this.state.password);
		this.setState({ errors: errors });
		if(Object.keys(errors).length !== 0) 
			return;		
		
		this.setState({ disabled: true }); //prevent submits while server is processing

		var postData = {
			username: this.state.username,
			password: this.state.password
		};
		var that = this; //good workaround?
		fetch('/api/login', {
			method: 'post',
			body: JSON.stringify(postData),
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		}).then(function(response) {
			if(response.status === 200) {
				return response.json(); 					
			} else if(response.status === 401){ //unauthorized credentials
				that.setState({ 
					errors: { submit: "Invalid login" },
					disabled: false
				});				
				return null;				
			} else {
				throw "error";
			}
		}).then(function(token) { //receive token
			if(!token) return; //better workaround?
			saveToken(token, () => {
				var username = currentUser();
				var user_id = userId();
				if(username  && user_id) {
					that.createChatUser(username, user_id);
				}
			});	
		}); 
	};

	createChatUser = (username, userId) => {
		var token = getToken();
		var that = this;
		fetch('/api/chatkitUser', {
			'method': 'POST',
			'body': JSON.stringify({
				username: username,
				userId: userId
			}),
			'headers': {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		})
		.then((response) => {
			if(response.status === 200 || response.status === 201) {
				that.props.onLogin(); //let Layout component know we're logged in
				that.props.history.push('/'); //redirect to home page
				return;
			}
			else {
				throw 'error';				
			}
		});
	};

	toggleSignUpForm = () => {
		this.form.current.toggle();
	}

	render() {
		var usernameErr, passwordErr, submitErr;
		if(this.state.errors.username) {
			usernameErr = <div style={{ color: 'red' }}>{this.state.errors.username}</div>;
		} 
		if(this.state.errors.password) {
			passwordErr = <div style={{ color: 'red' }}>{this.state.errors.password}</div>;
		}
		if(this.state.errors.submit) {
			submitErr = <div style={{ color: 'red' }}>{this.state.errors.submit}</div>;
		}
		var style = {
			width: this.state.width + 'px',
			height: this.state.height + 'px'
		};
		return(
			<div id="loginPage" style={style}>
				
					
					
						<div id="loginContainer">
							<h1 id="instabook">Instabook</h1>			
							<h2 id="login">Login</h2>					
							<form onSubmit={this.handleSubmit} id="loginForm">						
								<input className='form-control loginField' name='username' value={this.state.username} placeholder='Username' onChange={this.handleChange} />
								{usernameErr}
							
								<input className='form-control loginField' name='password' type='password' value={this.state.password} placeholder='Password' onChange={this.handleChange} />
								{passwordErr}
								
								<button className="btn btn-primary" id="loginSubmit" type="submit" disabled={this.state.disabled}>Submit</button>
								{submitErr}
							</form>	
							<p id='signUp'>Don't have an account? <span id='signUpInner' onClick={this.toggleSignUpForm}>Sign Up</span></p>
						</div>
						<SignUpForm ref={this.form} />
					
						
			</div>		
		);
	}
}

export default LoginForm;