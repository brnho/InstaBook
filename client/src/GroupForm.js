import React, { Component } from 'react';
import { isLoggedIn } from './services';

class GroupForm extends Component {
	state = {
		name: ''
		errors: {
			name: false
		},
		disabled: false,		
	};	

	componentWillMount() {
		if(!isLoggedIn()) {
			this.props.history.replace('/login');
		}
	}

	handleChange = (event) => {
		this.setState({
			username: event.target.value
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
					<input name='name' value={this.state.name} placeholder='Group name' onChange={this.handleChange} />
					<span style={{ color: 'red' }}>&nbsp;{this.state.errors.name}</span>
					<br/><br/>					
					<input type='submit' value='Submit' disabled={this.state.disabled} />
					<span style={{ color: 'red' }}>&nbsp;{this.state.errors.submit}</span>
				</form>
			</div>		
		);
	}
}

export default GroupForm;