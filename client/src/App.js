import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import './App.css';
import PostList from './Posts';
import UserForm from './UserForm';
import LoginForm from './LoginForm';
import Logout from './Logout.js';
import { isLoggedIn } from './services';

class App extends Component {
  state = {
    users: [],
    loggedIn: false
  }

  componentWillMount() {
    if(isLoggedIn()) {
      this.setState({ loggedIn: true });
    }
  }
  
  onLogout = () => {
    this.setState({ loggedIn: false });
  };

  onLogin = () => {
    this.setState({ loggedIn: true });
  };

  render() {
    var login, signup;
    if(this.state.loggedIn) {
      login = <Link to="/logout">Logout</Link>;
      signup = null;
    } else {
      login = <Link to="/login">Login</Link>;
      signup = <li><Link to="/signup">Sign Up</Link></li>; //
    }

    return (
      <Router>
        <div>         
          <ul>            
            <li><Link to="/posts">Posts</Link></li>
            {signup}            
            <li>{login}</li>
          </ul>          
          <Route exact path="/posts" component={PostList} />
          <Route exact path="/signup" component={UserForm} />  
          <Route 
            exact path="/login" 
            render={(props) => <LoginForm {...props} onLogin={this.onLogin} />}
          />
          <Route 
            exact path="/logout"
            render={(props) => <Logout {...props} onLogout={this.onLogout} />} 
          />        
        </div>        
      </Router>
    );
  }
}

export default App;
