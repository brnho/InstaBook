import React, { Component } from 'react';
import { getToken } from './services';

class InviteForm extends Component { //NEED EMAIL VERIFICATION!!!!
	state = {
		email: ''
	}

	onChange = (event) => {
		this.setState({ email: event.target.value });
	};

	onSubmit = (event) => {
		event.preventDefault();

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
				that.setState({ email: '' });
				return;
			} else {
				console.log('some error!'); //display some error message!!!
			}
		});
	}

	render() {
		return(
			<div>
				<form onSubmit={this.onSubmit}>	
					<label htmlFor='email'>Invite a member</label>			
					<input id='email' className='form-control' value={this.state.email} placeholder='Email' onChange={this.onChange} required/>
				</form>
			</div>
		);
	}
}

export default InviteForm;