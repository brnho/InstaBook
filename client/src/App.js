import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import './App.css';
import PostList from './Posts';
import UserForm from './UserForm';
import LoginForm from './LoginForm';
import Logout from './Logout.js';
import GroupForm from './GroupForm.js';
import { isLoggedIn, getToken } from './services';

class App extends Component {
  state = {
    users: [],
    loggedIn: false,
    groups: []
  }

  componentWillMount() {
    if(isLoggedIn()) {
      this.setState({ loggedIn: true });
      this.loadGroupsFromApi();
      this.interval = setInterval(this.loadGroupsFromApi, 5000); //poll api every 5 seconds
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  loadGroupsFromApi = () => {
    var that = this;
    var token = getToken(); //JWT is set as an HTTP header called Authorization
    fetch('/api/group', {
      method: 'get',
      headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token 
          }
    }).then(that.checkStatus)
      .then(res => res.json())
      .then(function(groups) {      
        that.setState({ groups: groups });
      });
  };

  checkStatus = (response) => {
    if (response.status >= 200 && response.status < 300) {
        return response;
      } else {
        console.log('help an error'); //change this
        //need to throw some error
      }
  };
  
  onLogout = () => {
    this.setState({ loggedIn: false });
    clearInterval(this.interval); //stop polling api upon logout
  };

  onLogin = () => {
    this.setState({ loggedIn: true });
    this.interval = setInterval(this.loadGroupsFromApi, 5000); //start polling the api again after logging in
  };

  render() {
    var login, signup, groups, groupButton;
    if(this.state.loggedIn) {
      login = <Link to="/logout">Logout</Link>;
      signup = null;                                    
      groups = this.state.groups.map((group, i) => {
        return(
          <li key={i}><a className="dropdown-item" href="{group._id}">{group.name}</a></li>
        );
      }); 

      groupButton = 
        <div className="dropdown">
          <button className="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
            Dropdown
            <span className="caret"></span>
          </button>
          <ul className="dropdown-menu" aria-labelledby="dropdownMenu1">
            {groups}
          </ul>
        </div>
    } else {
      login = <Link to="/login">Login</Link>; 
      signup = <li><Link to="/signup">Sign Up</Link></li>; 
      groupButton = null;
    }

    return (
      <Router>
        <div>         
          <ul>            
            <li><Link to="/posts">Posts</Link></li>
            <li><Link to="/createGroup">Create Group</Link></li>
            {signup}            
            <li>{login}</li>
          </ul>      
          {groupButton}
          <Route exact path="/posts" component={PostList} />
          <Route exact path='/createGroup' component={GroupForm} />
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
