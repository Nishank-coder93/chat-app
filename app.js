var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var path = require('path');
var morgan = require('morgan');
var http = require('http').Server(app);

var io = require('socket.io')(http); //socket.io

//var moment = require('moment');


/* The access to different roots */
var index = require('./routes/index');
var login = require('./routes/login');
var chat = require('./routes/chat')(io);
/**/

app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));

app.use('/',index);
app.use('/login',login);
app.use('/chat',chat);


/*
var clientInfo = {};

io.on('connection', function (socket){
		console.log('User connected via socket.io');


		socket.on('disconnect', function (){
			var userdata = clientInfo[socket.id];
			if (typeof userdata !== 'undefined'){
				socket.leave(userdata.talkto);
				io.to(userdata.talkto).emit('message', {
					name: 'System',
					text: userdata.name + ' has left!',
					timestamp: moment().valueOf()
				});

				delete clientInfo[socket.id];
			}
		});

		socket.on('talkTo', function (req){
			clientInfo[socket.id] = req;
			socket.join(req.talkto);
			console.log(req);
			socket.broadcast.to(req.talkto).emit('message', {
				name: 'System',
				text: req.name  + ' just entered the chat',
				timestamp: moment.valueOf()
			});
		});

		socket.on('message', function (message){
			
			message.timestamp = moment.valueOf();
			console.log("Message recieved: " + message.text);

			io.to(clientInfo[socket.id].talkto).emit('message', message);
		});

		socket.emit('message',{
			name: 'System',
			text: 'Welcome to the Chat Application !',
			timestamp: moment.valueOf()
		});
	});
*/
http.listen(PORT, function (){
	console.log(' Server Started ');
});