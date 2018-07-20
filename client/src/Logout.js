import { Component } from 'react';
import { logout } from './services.js';

class Logout extends Component {
	componentWillMount() {
		logout(); //does this need to be async?
		this.props.onLogout();
		this.props.history.replace('/login');
	}
	render() {		
		return(null);
	}
}

export default Logout;