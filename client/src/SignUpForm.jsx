import React, { Component } from 'react';
import * as EmailValidator from 'email-validator';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class SignUpForm extends Component {
	state = {
		email: '',
		username: '',
		password: '',
		errors: {
			email: false,
			username: false,
			password: false
		},
		disabled: false,
		modal: false
	};

	toggle = () => {
		this.setState({
			email: '',
			username: '',
			password: '',
			errors: {
				email: false,
				username: false,
				password: false
			},
			disabled: false,
			modal: !this.state.modal			
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

	validateInput = (username, password, email) => {
		var errors = {};
		if(!username) {
			errors.username = 'Username required';
		}
		if(!password) {
			errors.password = 'Password required';
		}
		if(!email) {
			errors.email = 'Email required';
		} else if(!EmailValidator.validate(email)) {
			errors.email = 'Please enter a valid email address';
		}		
		return errors;
	};	

	handleSubmit = (event) => {
		event.preventDefault();		
		//perform validation
		var errors = this.validateInput(this.state.username, this.state.password, this.state.email);
		this.setState({ errors: errors });
		if(Object.keys(errors).length !== 0) 
			return;		
		
		this.setState({ disabled: true }); //prevent submits while server is processing

		var postData = {
			email: this.state.email,
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
				that.toggle();
				return;				
			} else if(response.status === 409){ //duplicate email in database
				that.setState({ 
					errors: { email: "Email taken" },
					disabled: false
				});				
				return;				
			} else if(response.status === 410) { //duplicate username
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
		var emailErr, usernameErr, passwordErr;
		if(this.state.errors.email) {
			emailErr = <div style={{ color: 'red' }}>{this.state.errors.email}</div>;
		} 
		if(this.state.errors.username) {
			usernameErr = <div style={{ color: 'red' }}>{this.state.errors.username}</div>;
		} 
		if(this.state.errors.password) {
			passwordErr = <div style={{ color: 'red' }}>{this.state.errors.password}</div>;
		}	

		return(
			<div>
				<Modal isOpen={this.state.modal} toggle={this.toggle}>	
				<ModalBody>		
				<h2>Sign Up</h2>
				<form onSubmit={this.handleSubmit} id="signUpForm">	
					<input className='form-control signUpField' name='email' value={this.state.email} placeholder='Email' onChange={this.handleChange} />
					{emailErr}				
					<input className='form-control signUpField' name='username' value={this.state.username} placeholder='Username' onChange={this.handleChange} />
					{usernameErr}
					<input className='form-control signUpField' name='password' type='password' value={this.state.password} placeholder='Password' onChange={this.handleChange} />
					{passwordErr}
					<button className="btn btn-primary" id="signUpSubmit" type="submit" disabled={this.state.disabled}>Submit</button>
				</form>
				</ModalBody>
				</Modal>		
			</div>		
		);
	}
}

export default SignUpForm;