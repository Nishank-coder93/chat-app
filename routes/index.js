var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });

});

// io.on('connection', function (socket){
// 		console.log('User connected via socket.io');

// 		socket.on('message', function (message){
// 			console.log("Message recieved: " + message.text);

// 			io.emit('message', message);
// 		});

// 		socket.emit('message',{
// 			text: 'Welcome to the Chat Application !'
// 		});
// 	});

module.exports = router;
