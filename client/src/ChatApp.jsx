import React, { Component } from 'react';
import Chatkit from '@pusher/chatkit';
import { getToken, avatar } from './services';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import spinner from './Spinner-1s-28px.gif';

var instanceLocator = 'v1:us1:d240e83d-f99c-44d7-ae6f-08b42180a620';

class ChatDisplay extends Component { //props: username, userId, roomId
	constructor(props) {
    super(props);
    this.messageList = React.createRef();
    this.channelModal = React.createRef();
  }

  state = {
    currentRoom: {},
    currentUser: {},
    messages: [],
    channels: []
  }

  componentDidMount() {
    var that = this;
    var token = getToken(); 
    var user_id = parseInt(this.props.userId, 10);
    var tokenProvider = new Chatkit.TokenProvider({
      url: 'http://localhost:3001/api/chatkitAuth',
      queryParams: { userId: user_id },                                                                                                         
      headers: { Authorization: 'Bearer ' + token}
    });

    var chatManager = new Chatkit.ChatManager({
      instanceLocator: instanceLocator,
			userId: that.props.userId, //bc we set the userId this way when we created a new chatkit user
			tokenProvider: tokenProvider
		});

    chatManager
    .connect()
    .then((currentUser) => {
				that.setState({ currentUser }); //store reference to currentUser
        var channelList = currentUser.rooms.map((room) => {
          return [room.name, room.id];
        });
        that.setState({ channels: channelList }); //populate channels with the rooms the user is a member of
				return currentUser.subscribeToRoom({
					roomId: parseInt(that.props.roomId, 10), //12386251
          messageLimit: 20, //onNewMessage hook will be called for the past 100 messages
          hooks: {
						onNewMessage: message => { //updates state whenever a message is sent to the room
							that.setState({ messages: [...that.state.messages, message] })
						}
					}
				});
			})
    .then(currentRoom => {
      that.setState({ currentRoom })
    })
    .catch(error => console.error('error', error));
  }

  forceScrollToBottom = () => {
    var box = this.messageList.current;
    box.scrollTop = box.scrollHeight - box.clientHeight;
  }  

  sendMessage = (text) => {
    this.state.currentUser.sendMessage({
      text,
      roomId: this.state.currentRoom.id
    });
  }; 

  createChannel = (name) => {
    this.state.currentUser.createRoom({
      name: name
    }).then(room => {
      var channelList = [...this.state.channels, [room.name, room.id]];
      this.setState({ channels: channelList });
    })
    .catch(err => console.log(err));
  };

  onChannelClick = (name, roomId) => {
    var that = this;
    this.setState({ messages: [] });
    this.state.currentUser.subscribeToRoom({
      roomId: parseInt(roomId, 10),
      messageLimit: 100,
      hooks: {
        onNewMessage: message => { //updates state whenever a message is sent to the room
          that.setState({ messages: [...that.state.messages, message] })
        }
      }
    }).then(currentRoom => {
      that.setState({ currentRoom });
    })
    .catch(error => console.log(error));
  }

  openChannelModal = () => {
    this.channelModal.current.toggle();
  }  

  showOldMessages = (oldMessages) => {
    if(oldMessages) { //avoid adding an empty object
      this.setState({ messages: [...oldMessages, ...this.state.messages,] });
    }
  }

  render() {
    return(
      <div id='chatContainer'>
        <ChannelList
          channels={this.state.channels}
          onChannelClick={this.onChannelClick}
        />
        <button id="channelButton" onClick={this.openChannelModal}>Create a channel</button>
        <ChannelModal ref={this.channelModal} 
          createChannel={this.createChannel} 
        /> 
        <div id="messageHeader">
          #{this.state.currentRoom.name}
        </div>     
        <MessageList
            messages={this.state.messages}
            currentUser={this.state.currentUser}
            currentRoom={this.state.currentRoom}
            showOldMessages={this.showOldMessages}
         />            
        <MessageForm
          sendMessage={this.sendMessage}
        />       
      </div>
    );
  }
}

class MessageList extends Component { //props: currentUser, messages (message has sender.name and text), currentRoom
  state = {
    isLoading: false,
    noMoreMessages: false
  }

  constructor(props) {
    super(props);
    this.container= React.createRef();
  }

  loadOldMessages = (evt) => {
    this.setState({ isLoading: true });
    var oldestMessageIdReceived = Math.min(...this.props.messages.map(m => m.id));
    this.props.currentUser.fetchMessages({
      roomId: this.props.currentRoom.id,
      initialId: oldestMessageIdReceived,
      direction: 'older',
      limit: 15,
    })
    .then(messages => {
      if(Object.keys(messages).length) {
        this.props.showOldMessages(messages);
      } else {
        this.setState({ noMoreMessages: true });
      } 
      this.setState({ isLoading: false });         
    })
    .catch(err => {
      console.log('Error fetching messages: ${err}');
    });    
  }
  
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  componentWillUpdate() {
    var container = this.container.current;
    this.shouldScrollToBottom = container.scrollTop + container.clientHeight + 10 >= container.scrollHeight;
    //max scroll top = scrollHeight - clientHeight. we make the check before component updates (new message appears)
  }

  componentDidUpdate() {
    if(this.shouldScrollToBottom) {
        var container = this.container.current;
        container.scrollTop = container.scrollHeight;
    }
  }  

  render() {
    var i;
    var displayMessages = [];
    var messages = this.props.messages;
    for(i = 0; i < messages.length; i++) {
      var date1, date2, elapsed;
      if(i !==0) { //figure out how much time passed between the current and previous messages
        date1 = new Date(messages[i].createdAt);
        date2 = new Date(messages[i-1].createdAt);
        elapsed = (date1.getTime() - date2.getTime()) / 1000; //seconds
      } else { 
        date1 = new Date(messages[i].createdAt);
      }

      if(i !== 0 && messages[i-1].sender.id === messages[i].sender.id && elapsed < 60) { //don't display user's picture and username
        displayMessages.push(
          <div key={i}>
            <p id='messageText'>{messages[i].text}</p>
          </div>
        );
      } else {
        var url = avatar(messages[i].sender.name, 20);
        var amOrPm = (date1.getHours() < 12) ? "AM" : "PM";
        var hour = (date1.getHours() < 13) ? date1.getHours() : date1.getHours() - 12;
        var minutes = (date1.getMinutes() < 10) ? '0' + date1.getMinutes() : date1.getMinutes();
        var time = hour + ':' + minutes + ' ' + amOrPm;        
        displayMessages.push(
          <div key={i} id='messageBlock'>
            <img src={url} alt='loading gif' /> <span id='messageAuthor'>{messages[i].sender.name}</span> <span id='messageTime'>{time}</span>
            <p id='messageText'>{messages[i].text}</p>
          </div>
        );
      }
    }
    var text;
    if(displayMessages.length === 0) {
      text = <div id="emptyChat">Be the first to say something!</div>;
    }
    if(this.state.isLoading) {
      var img = <img src={spinner} />;
    }
    var end;
    if(this.state.noMoreMessages) {
      end = <p id='noMoreMessages'>No more messages to display</p>;
    } else {
      end = <p onClick={this.loadOldMessages} id='loadOlderMessages'>Load older messages</p>;
    }    
    return(  
      <div id='messageList' ref={this.container}>
        {end}
        {img}
        {text}
        {displayMessages}
      </div>
    );
  }
}

class MessageForm extends Component { //props: sendMessage
  state = {
    input: ''
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  };

  onSubmit = (event) => {
    event.preventDefault();
    this.props.sendMessage(this.state.input);
    this.setState({ input: '' });
  };

  render() {
    return(
      <form id='chatForm' onSubmit={this.onSubmit}>
        <input id='chatInput' value={this.state.input} placeholder="Type your message" onChange={this.onInputChange} autoComplete="off" />
      </form>
    );
  }
}

class ChannelList extends Component {
  onChannelClick = (event) => {
    this.props.onChannelClick(event.target.textContent.substring(1), event.target.getAttribute('roomid'));
  };

  render() {
    var channels = this.props.channels.map((channel, i) => {      
      return(<p key={i}><a href="javascript:void(0)" id="channelText" roomid={channel[1]} onClick={this.onChannelClick}>#{channel[0]}</a></p>);
    });

    return(
      <div id='channels'>
        <div id='channelHeader'>Your Channels</div>
        {channels}
      </div>
    );
  }
}

class ChannelModal extends Component {  //props: createChannel
  state = {
    modal: false,
    input: '',
    checked: false,
    error: ''
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  }

  onSubmit = (event) => {
    event.preventDefault();
    if(!this.state.input) {
      this.setState({ error: 'Empty field'});
      return;
    }
    this.props.createChannel(this.state.input);
    this.setState({ input: '' });
    this.toggle();
  }

  toggle = () => {
    this.setState({ 
      modal: !this.state.modal,
      error: '',
      input: ''
    });
  }

  onCheck = (event) => {
    this.setState({ checked: event.target.checked });
  }

  render() {
    var error;
    if(this.state.error) {
      error = <div style={{ color: 'red' }}>{this.state.error}</div>;
    }
    return(
      <div>
        <Modal isOpen={this.state.modal} toggle={this.toggle}>
          <ModalHeader toggle={this.toggle}>Create a Channel</ModalHeader>
          <form id='channelForm' onSubmit={this.onSubmit}>
            <ModalBody>              
              <textarea id='channelInput' value={this.state.input} placeholder="Create a channel" onChange={this.onInputChange} />
            </ModalBody>
            <ModalFooter>
              <label id='checkbox'><input type="checkbox" onChange={this.onCheck} />Private</label>
              <button type="submit" className="btn btn-secondary">Submit</button>
              {error}
            </ModalFooter>
          </form>
        </Modal>
      </div>      
    );
  }
}

export default ChatDisplay;