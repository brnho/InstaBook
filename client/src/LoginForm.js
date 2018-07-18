import React, { Component } from 'react';
import { saveToken } from './services';

class LoginForm extends Component {
	state = {
		username: '',
		password: '',
		errors: {
			username: false,
			password: false,
			submit: false
		},
		disabled: false		
	};	

	handleUsernameChange = (event) => {
		this.setState({
			username: event.target.value
		});
	};

	handlePasswordChange = (event) => {
		this.setState({
			password: event.target.value
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
				return response.json(); //this async is super important						
			} else if(response.status === 401){ //unauthorized credentials
				that.setState({ 
					errors: { submit: "Invalid login" },
					disabled: false
				});				
				return null;				
			} else {
				console.log("some error occurred..."); //not sure how this is supposed to be done
				console.log(response);
			}
		}).then(function(token) { //receive a jwt from the login api
			if(token) {
				saveToken(token);
				that.props.onLogin();
				that.props.history.push('/posts');
			}
		}); 
	};

	render() {		
		return(
			<div>
				<h2>Login</h2>					
				<form onSubmit={this.handleSubmit}>					
					<input name='username' value={this.state.username} placeholder='Username' onChange={this.handleUsernameChange} />
					<span style={{ color: 'red' }}>&nbsp;{this.state.errors.username}</span>
					<br/><br/>
					<input name='password' type='password' value={this.state.password} placeholder='Password' onChange={this.handlePasswordChange} />
					<span style={{ color: 'red' }}>&nbsp;{this.state.errors.password}</span>
					<br/><br/>
					<input type='submit' value='Submit' disabled={this.state.disabled} />
					<span style={{ color: 'red' }}>&nbsp;{this.state.errors.submit}</span>
				</form>
			</div>		
		);
	}
}

export default LoginForm