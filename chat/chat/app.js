var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var http = require('http').Server(app);
var serversocket = require('socket.io')(http);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

membernames=[]
memberids=[]
/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

serversocket.on('connection', function(clientsocket){
  console.log('a user connected');
  clientsocket.on('disconnect', function(){
    var a = memberids.indexOf(clientsocket.id);
    membernames.splice(a,1);
    memberids.splice(a,1);
    console.log('user disconnected');
  });
    
 clientsocket.on('private', function(msg){
    var a = membernames.indexOf(msg.to);
    if(a > -1 ){
        serversocket.to(memberids[a]).emit('private' , msg);
    }
  });

//make it to send ten names
/*  clientsocket.on('getids', function(msg){
    var a = membernames.indexOf(msg.to);
    if(a > -1 ){
        serversocket.to(memberids[a]).emit('private' , msg.message);
    }
  });

*/
//broadcasting messages
  clientsocket.on('room1 message', function(msg){
    msg.messaage = msg.message.replace('>', '');
    msg.messaage = msg.messaage.trim();
    if(clientsocket.rooms.indexOf(msg.room) > -1 && msg.messaage != ""){
        serversocket.to("room1").emit('chat message' , membernames[memberids.indexOf(clientsocket.id)]+'>'+msg.message );
    }
  });
    clientsocket.on('room2 message', function(msg){
    if(clientsocket.rooms.indexOf(msg.room) > -1 ){
        serversocket.to("room2").emit('chat message' , membernames[memberids.indexOf(clientsocket.id)]+'>'+msg.message );
    }
  });
    clientsocket.on('room3 message', function(msg){
    if(clientsocket.rooms.indexOf(msg.room) > -1 ){
        serversocket.to("room3").emit('chat message' , membernames[memberids.indexOf(clientsocket.id)]+'>'+msg.message );
    }
  });

  clientsocket.on('registerme', function(username){
    if(membernames.indexOf(username) == -1){
        serversocket.to(clientsocket.id).emit('registerme' , username);
        membernames.push(username);
        memberids.push(clientsocket.id);
        clientsocket.join("room1");
        serversocket.to(clientsocket.id).emit('join' ,"room1");
    }
    else
        clientsocket.disconnect();
  });
  
  clientsocket.on('join', function(roomname){
    if (roomname == "room1") {
        clientsocket.join("room1");
        serversocket.to(clientsocket.id).emit('join' ,roomname);
    }else if (roomname == "room2") {
        clientsocket.join("room2");
        serversocket.to(clientsocket.id).emit('join' , roomname);
    }
    else if (roomname == "room3") {
        clientsocket.join("room3");
        serversocket.to(clientsocket.id).emit('join' , roomname);
    }
    else {
        serversocket.to(clientsocket.id).emit('join' , "error");
    }
    
    });

 clientsocket.on('unjoin', function(roomname){
    if (clientsocket.rooms.length == 1 ){
        serversocket.to(clientsocket.id).emit('unjoin' ,"error");
    }
    else if (clientsocket.rooms.indexOf(roomname) > -1){
        clientsocket.leave(roomname);
        console.log(roomname);
        serversocket.to(clientsocket.id).emit('unjoin' , roomname);    
    }
    else{
        serversocket.to(clientsocket.id).emit('unjoin' ,"error");
    }

  });



});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

module.exports = app;
