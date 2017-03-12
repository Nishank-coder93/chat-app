var socket = io();
var username = getQueryVariable('name') || 'Anonymous'; // if no name is given then choose Anonymous
var num_of_users = 0; // maintains num of users locally
var users = [];  // maintains the record of users
var chatList = [];
var currentChatInfo; 
var user_detail;
var talk_to = "";
$("#invitation_space").hide();

// On initial connection 
socket.on('connect', function (){
	 console.log('Connected to socket.io server ');

	 // Sends the server with information about the Client that joined the system;
	socket.emit('userinfo',{
		name: username,
		invisible: false
	});
});

// This socket is received when the user is joined and gets the info about user detail
socket.on('userjoined', function (userdetail){
	var exist = false;

	//keeps track of the users and maintains their record 
	user_detail = userdetail;
	num_of_users = userdetail.length;

	// Maintains a local copy of all the users present in the system
	for (var i = 0; i < userdetail.length; i++) {

		if (users.length == 0){
			users.push(userdetail[i].name);

			// Shows the user logged in info on the login panel 
			if (users[i] != username){
				$("#online_status").append("<div class =' alert alert-success' id='" + users[i].replace(" ", "-") + "'><strong>" + users[i] + "</strong></div>");
			}
		}
		else{
			for (var j = 0; j < users.length; j++) {
			  if( users[j] == userdetail[i].name) {
			  	exist = true
			  	break;
			  }

			}
			if (exist == false){
				users.push(userdetail[i].name);
				if (users[i] != username){
				$("#online_status").append("<div class='alert alert-success' id='" + users[i].replace(" ", "-") + "'><strong>" + users[i] + "</strong></div>");
				}
			}
			else{
				exist = false;
			}

		}
	}

	console.log(users);

});

// Handles who to talk to
var $form = jQuery('#talk-to');
$form.on('submit', function (event){
	event.preventDefault(); //Which handles the form submission without refreshing

	// gets the name and checks if it exist in the system
	talk_to = $form.find('input[name=talk-to-who]').val();

	var exist = false;
	for( var i = 0; i < users.length; i++){
		if (users[i] == talk_to){
			exist = true
		}
	}
	if(exist == true){
		socket.emit('talkto',{
		username: username,
		chatwith: $form.find('input[name=talk-to-who]').val()
		});
	}
	//if not then show error on the timeline
	else {
		$("#timeline").append("<h4> Bad Name !! User not present in the system !");
	}

	$form.find('input[name=talk-to-who]').val('');
});

// When a chat request is made this Socket handles the details of the front end
// Shows the Invitaion and handles the acceptance and decline
/**** Possible logic bug here ****/
socket.on('chatRequest', function (detail){

	$('#chat_invitation').text(detail.userOne + ' wants to talk to you ');
	$("#invitation_space").show();

	// If the Client accepts the invite 
	$("#accept_button").on('click', function (event){
		detail.accept = true;
		$("#invitation_space").hide();
		$("#message_space").show();
		$("#login_detail").hide();
		$("#timeline_space").hide();
		talk_to = detail.userOne;
		$("#timeline").append("<h3> you were in a conversation with " + detail.userOne + "<h3>");

		currentChatInfo = detail;
		// send the invitation details to Server on accept
		chatList.push(currentChatInfo);
		socket.emit('invitationInfo', detail);
	});

	// if the Client declines the request  
	$("#decline_button").on('click', function (event){
		detail.accept = false;
		$("#invitation_space").hide();
		$("#timeline").append("<h3> you decline chat with " + detail.userOne + "<h3>");
		socket.emit('invitationInfo', detail);
	});

});

// If the client has accpeted the server handles the infromation and this socket handles the front end
socket.on('acceptance', function (detail){
	currentChatInfo = detail;
	$("#invitation_space").hide();
	$("#message_space").show();
	$("#login_detail").hide();
	$("#timeline_space").hide();
});

// If the User declines to chat
socket.on('decline', function (detail){
	console.log(detail);
	alert(detail);
});

// when one client initiates closing of the chat
$("#close_chat").on('click', function (event){
	$('#message-block').html(" <p> </p>");
	$('#message_space').hide();
	$('#login_detail').show();
	$("#timeline_space").show();
	//send the close info to the server to take care of removing the chat info from server
	closeInfo = {
		userOne: currentChatInfo.userOne,
		userTwo: currentChatInfo.userTwo,
		accept: false,
		from: username
	}
	socket.emit('close_chat', closeInfo);
});

// When chat close request is received from the user 
socket.on('chatClose', function () {
	$('#message-block').html(" <p> </p>");
	$('#message_space').hide();
	$('#login_detail').show();
	$('#timeline_space').show();

});

// If the client is busy as in is engaged  with another client
socket.on('busy', function (sock){
	if(sock.username == username){
		$("#timeline").append("<h3>" + sock.name + " is Busy !!, please try again later </h3>");
	}
});

// This is the main message socket handler 
socket.on('message', function (message){
	var $message_block = jQuery('#message-block');
	var momentTimestamp = moment.utc(message.timestamp);

	var msgtxt = "<p><strong>" + message.username + " " + momentTimestamp.local().format("h:mm a") + "</strong>: " + message.text + "</p>";
	$message_block.append(msgtxt);
});


// When the user leaves the system.
socket.on('left', function (userout){
	$('#timeline').append("<h3>" + userout.username + " HAS LEFT THE SERVER !! </h3>");
	$("#" + userout.username.replace(" ","-")).remove();

	for (var i = 0; i < users.length; i++) {
		if ( users[i] == userout.username) {
			users.splice(i,1);
		}
	}

	console.log(users);
});

// Handles submiting of new message 
var $message_form = jQuery('#message-form');
$message_form.on('submit', function (event){
	event.preventDefault(); //Which handles the form submission without refreshing

	socket.emit('message',{
		response: 200,
		username: username,
		talkto: talk_to,
		text: $message_form.find('input[name=message]').val(),
		timestamp: moment.valueOf()
	});

	$message_form.find('input[name=message]').val('');
});