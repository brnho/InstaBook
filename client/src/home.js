import React, { Component } from 'react';
import { isLoggedIn, currentUser } from './services';

class Home extends Component {
	state = {
		username: ''
	}

	componentWillMount() {
		if(!isLoggedIn()) {
			this.props.history.replace('/login');
		}
		var username = currentUser();
		if(username) { //async just in case?
			this.setState({ username: username });
		}
	}

	render() {
		return(
			<div className="d-flex justify-content-center" id="welcome">
				<h1>Hello, {this.state.username}!</h1>
			</div>
		);
	}
}

export default Home;