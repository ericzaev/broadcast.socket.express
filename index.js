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

app.get('/room/:room/users', async (request, response) => {
  const sockets = await room.in(request.params.room).fetchSockets();

  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(sockets.map(socket => socket.room.user)));
});

io.of('/user').use(async (socket, next) => {
  if (!socket.user) {
    try {
      const handshake = socket.handshake;

      if (handshake.auth['token'] || handshake.headers['cookie']) {
        socket.user = await rest.fetchUser(handshake.auth['token'], handshake.headers['cookie']);
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
      const handshake = socket.handshake;

      if (handshake.auth['code']) {
        socket.room = await rest.fetchRoom(handshake.auth['code'], handshake.auth['token'], handshake.headers['cookie']);
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

const room = io.of('/room');

room.on('connection', async socket => {
  socket.on('message', data => 
    room.to(socket.room.code).emit('message', {data, user: socket.room.user}));

  socket.on('disconnect', () => 
    room.to(socket.room.code).emit('leave', socket.room.user));

  room.to(socket.room.code).emit('join', socket.room.user);

  socket.join(socket.room.code);

  socket.emit('users', 
    (await room.in(socket.room.code).fetchSockets()).map(socket => socket.room.user));
});

http.listen(3000);