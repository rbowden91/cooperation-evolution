#!/usr/bin/nodejs

var express = require('express');
var app = express();
var http = require('http').Server(app);

app.use(express.static('public'));

http.listen(2890, function(){
  console.log('listening on *:2890');
});
