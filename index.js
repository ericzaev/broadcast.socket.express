const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {path: process.env.SOCKET_PATH || '/socket', pingTimeout: 10000, pingInterval: 5000});
const rest = require('./rest');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(function (request, response, next) {
  const token = process.env.ACCESS_TOKEN;

  if (token && token === request.query['access_token']) {
    next();
  } else {
    response.status(403);
    response.end();
  }
});

app.post('/user/:user/:event', (request, response) => {
  io.of('/user').to(parseInt(request.params.user)).emit(request.params.event, request.body);
  
  response.end();
});

app.post('/room/:room/:event', (request, response) => {
  io.of('/room').to(request.params.room).emit(request.params.event, request.body);
  
  response.end();
});

io.of('/user').use(async (socket, next) => {
  if (!socket.user) {
    try {
      if (socket.handshake.auth['token']) {
        socket.user = await rest.fetchUserByToken(socket.handshake.auth['token']);
      }
  
      if (socket.handshake.headers['cookie']) {
        socket.user = await rest.fetchUserByCookie(socket.handshake.headers['cookie']);
      }
    } catch (error) {}
  }

  if (socket.user) {
    next();
  } else {
    next(new Error('Unauthenticated'));
  }
});

io.of('/room').use(async (socket, next) => {
  if (!socket.room) {
    try {
      if (socket.handshake.auth['code']) {
        socket.room = await rest.fetchRoomByCode(socket.handshake.auth['code']);
      }
    } catch (error) {}
  }

  if (socket.room) {
    next();
  } else {
    next(new Error('Room not found'));
  }
});

io.of('/user').on('connection', socket => socket.join(socket.user.id));
io.of('/room').on('connection', socket => socket.join(socket.room.code));

http.listen(3000);