import React, { Component } from 'react';
import { getToken } from './services';
import * as EmailValidator from 'email-validator';

class InviteForm extends Component { //NEED EMAIL VERIFICATION!!!!
	state = {
		email: '',
		success: false,
		error: ''
	}

	onChange = (event) => {
		this.setState({ email: event.target.value });
	};

	onSubmit = (event) => {
		event.preventDefault();
		if (!EmailValidator.validate(this.state.email)) {
			this.setState({ error: 'Invalid email' });
			return;
		}
		var postData = {
			groupId: this.props.groupId,
			groupName: this.props.groupName,
			email: this.state.email
		};
		var token = getToken();
		var that = this;
		fetch('/groupInvite', {
			method: 'post',	
			body: JSON.stringify(postData),		
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}).then(function(response) {
			if(response.status === 200) { //email successfully sent
				that.setState({ 
					email: '',
					sucess: true,
					error: ''
				});
				return;
			} else {
				that.setState({ error: 'Sorry, problem encountered sending email' });
				console.log('some error!'); //display some error message!!!
			}
		});
	}

	render() {
		if(this.state.sucess) {
			var success = <div>Invitation sent!</div>;
		}
		if(this.state.error) {
			var error = <div>{this.state.error}</div>;
		}
		return(
			<div>
				<form onSubmit={this.onSubmit}>	
					<label htmlFor='email'>Invite a member</label>			
					<input id='email' className='form-control' value={this.state.email} placeholder='Email' onChange={this.onChange} autoComplete="off" required/>
				</form>
				{success}
				{error}
			</div>
		);
	}
}

export default InviteForm;