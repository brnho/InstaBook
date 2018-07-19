import React, { Component } from 'react';
import { BrowserRouter as Route, Redirect } from "react-router-dom";

class UserForm extends Component {
	state = {
		username: '',
		password: '',
		errors: {
			username: false,
			password: false
		},
		disabled: false,
	};

	/*
	setFormRef = (element) => { //note this is an older version of react
		this.form = element; //get a reference to the form so I can manually submit it		
	};
	*/

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

		fetch('/api/user', {
			method: 'post',
			body: JSON.stringify(postData),
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		}).then(function(response) {
			if(response.status === 201) {
				that.props.history.push('/login');
				return;				
			} else if(response.status === 409){ //duplicate username in database
				that.setState({ 
					errors: { username: "Username taken" },
					disabled: false
				});				
				return;				
			} else {
				console.log("some error occurred..."); //not sure how this is supposed to be done
				console.log(response.json());
			}
		}); 
	};

	render() {		
		return(
			<div className="d-flex justify-content-center">
			<div className="d-flex flex-column mt-3">	
				<h2>Sign Up</h2>							
				<form onSubmit={this.handleSubmit}>					
					<input name='username' value={this.state.username} placeholder='Username' onChange={this.handleUsernameChange} />
					<span style={{ color: 'red' }}>&nbsp;{this.state.errors.username}</span>
					<br/><br/>
					<input name='password' type='password' value={this.state.password} placeholder='Password' onChange={this.handlePasswordChange} />
					<span style={{ color: 'red' }}>&nbsp;{this.state.errors.password}</span>
					<br/><br/>
					<input type='submit' value='Submit' disabled={this.state.disabled} />
				</form>
			</div>
			</div>		
		);
	}
}

export default UserForm;