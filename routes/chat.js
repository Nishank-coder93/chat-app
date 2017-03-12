var express = require('express');
var chatrouter = express.Router();
var path = require('path');
var moment = require('moment'); // For timestamp 

var clientInfo = []; // Server maintains a common Client Info list 
var chatList = []; // Server maintains a list of Clients chatting
var numofclient = 0; // Server Maintains the numbr of clients present in the system
var chatListInfo; // Detail of the chat to bounce to and fourth between server and client

// Messaging System
var from = "";  
var talk_to = "";
var to_socket;


// This is a getSocket function which returns the socket ID of the particlar client
function getSocketId(name) {
	var socketId;
	for (var i = 0; i < clientInfo.length; i++) {
			if(clientInfo[i].name == name) {
				socketId = clientInfo[i].socketid;
			}
		};

	return socketId;
}

var returnRouter = function (io){

	/* GET home page. */
	chatrouter.get('/', function (req, res) {
		// On initial request server sends the Chat page which is represented in the chat HTML (Frontend)
	  res.sendFile(path.join(__dirname, '../public', 'chat.html'));

	});

	// On the initial connection to the server On connection is exectued which generates the unique socket ID
	io.on('connection', function (socket){

		 // After the initial connection function to maintain and distribute the user information
		socket.on('userinfo', function (userinfo){ 
			// Adds the user information in an Array ClientInfo which maintains the users information on the server
			clientInfo.push({
				socketid: socket.id,
				name: userinfo.name,
				invisible: userinfo.invisible,
				availability: "Available"
			});

			// Updates the Number of client information on the server
			// This variable is used to track the number of clients present in the system
			numofclient = clientInfo.length;


			// This emit pushes the user information to the frontend 
		 	io.emit('userjoined', clientInfo);

		 });

		// When the Server gets the Talk to a client request initiation from a client.
		socket.on('talkto', function (chatdetail){

			// Retrieves the SocketID of the client to chatwith
			to_socket = getSocketId(chatdetail.chatwith);
		
			// Checks if its the first initiation in the system
			if (chatList.length == 0) {

				// Maintain Chat List information record 
				chatListInfo = {
					userOne: chatdetail.username,
					userTwo: chatdetail.chatwith,
					accept: false
				};

				// Send a Chat Request to client that user wants to chat with
				socket.broadcast.to(to_socket).emit('chatRequest', chatListInfo);
			}
			// Executed if there are more than set of Users are engaged in Chat
			else {
				var exist = true; // Variable to see if the user client is looking for exist  
				var busy = false; // Variable to check if the user client is looking for is already engaged
				// We assume that client is not engaged hence busy is false initially

				/* Start of for loop */
				// Since there are more than one users in the Chat list loop through to lookup for the user that client wants to chat with
				for (var j = 0 ; j < chatList.length; j++) {


	// Lookup for the chat detail in the ChatList from the incoming chat request chatdetal which has the information of chat request
					if ((chatList[j].userOne == chatdetail.chatwith) || (chatList[j].userTwo == chatdetail.chatwith)) {
						exist = true; // If condition passes then the user exist

						// if the users acceptance attribute is not true then user is not busy and boradcast a chat request
						if( chatList[j].accept != true){

							chatListInfo = {
								userOne: chatdetail.username,
								userTwo: chatdetail.chatwith,
								accept: false
							};
							socket.broadcast.to(to_socket).emit('chatRequest', chatListInfo);
						}
						// If the user is busy 
						else {
							busy = true;
						}
						break; // Break from the foor loop since user found
					}
					// User isnt engaged with anyone. 
					else{
						exist = false;
					}
				}
				/* End of for loop*/

				// If the user isn't engaged with another user then send chat request
				if (exist == false) {
					chatListInfo = {
						userOne: chatdetail.username,
						userTwo: chatdetail.chatwith,
						accept: false
					};

					socket.broadcast.to(to_socket).emit('chatRequest', chatListInfo);
				}

				// if the user Exist and is engaged with another user then tell the client that user is busy
				if (busy == true) {
					var sendMsg = chatdetail.chatwith + " is Busy, Please try again later !";
					var socket_from_id = getSocketId(chatdetail.username);

					socket.emit('busy', {name: chatdetail.chatwith, username: chatdetail.username});

				}
			}

		});

        // When an invitation to chat is sent from one client this socket handles that request
		socket.on('invitationInfo', function (detail){
			var from_socket = getSocketId(detail.userOne);

				// if the client accepted users invitation then the detail object Accept attribute will be true
				if (detail.accept == true){
					var exist = false;

					// this is to check if the client-client info is already present in the system
					// if (chatList.length > 0){
					// 	for (var i = 0; i < chatList.length; i++){
					// 		if(chatList[i].userOne == detail.userOne && chatList[i].userTwo == detail.userTwo){
					// 			exist = true;
					// 			break;
					// 		}
					// 	}

					// 	if (exist == false){
					// 		chatList.push(detail);
					// 	}
					// }
					chatList.push(detail);

					// Send the acceptance detail to the user who requested for chat. 
					socket.broadcast.to(from_socket).emit('acceptance', detail);
				}
				else {
					// the user denied the request send a decline response to the client
					 var msg = detail.userTwo + " has denied your request";
					socket.broadcast.to(from_socket).emit('decline', msg);
				}


			});

		// When chat close is initiated this socket handles the deletion of user chat info resets the 
		socket.on('close_chat', function (closedetail){
			if (chatList.length == 1){
				chatList = [];
			 }
			else {
				for( var i = 0; i < chatList.length; i++) {
					if ((chatList[i].userOne == closedetail.userOne) && (chatList[i].userTwo == closedetail.userTwo)) {
						chatList.splice(i,1);
					}
				}
			}

			var socket_of_to;

			if (closedetail.userOne != closedetail.from){
				socket_of_to = getSocketId(closedetail.userOne);
			}
			else {
				socket_of_to = getSocketId(closedetail.userTwo);
			}

			socket.broadcast.to(socket_of_to).emit('chatClose');

		});

		// on disconnect request that is closing the tab or exiting the system results in disconnect 
		socket.on('disconnect', function (){
			var index_val = 0;
			var userdata = "";

			// If only one client present in the system
			if( clientInfo.length == 1) {
				 userdata = clientInfo[index_val].name;

				clientInfo = [];
			}
			else{
				// otherwise loops through the client info list and sets the index value of the client to be removed
				for(var i = 0; i < clientInfo.length; i++){
				if ( clientInfo[i].socketid == socket.id){
				   userdata = clientInfo[i].name;
				   index_val = i;
					}
				}
			}

			console.log(userdata + " Has Left the System !!");

			// Notify all the users that the client has left the system
			socket.broadcast.emit('left',{
				username: userdata
			});

			 	if (index_val != -1){
			 		clientInfo.splice(index_val,1);
			 	}

		});

		// This socket handles the incoming message and delivering it to the right person
		socket.on('message', function (message){
			var status;
			if(message.response == 200){
				status = "200 ok";
			}

			var d = new Date();
			message.timestamp = moment.valueOf();
			header = {method: "HTTP/ 1.1 ",
		              status: status,
		              timestamp: d,
		              header: message.text
		              };

		    console.log(header);
			var socket_to = getSocketId(message.talkto);

			socket.broadcast.to(socket_to).emit('message',message);

		 });
	});

	return chatrouter;

}

module.exports = returnRouter;