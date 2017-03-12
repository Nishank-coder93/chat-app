var express = require('express');
var loginRouter = express.Router();

loginRouter.route('/')
.get(function (req,res){
	res.send('This is the login page')
});

module.exports = loginRouter;