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

app.post('/:nsp/:room/:event', (request, response) => {
  io.of(request.params.nsp).to(request.params.room).emit(request.params.event, request.body);

  response.end();
});

app.get('/:nsp/:room/users', async (request, response) => {
  const sockets = await io.of(request.params.nsp).in(request.params.room).fetchSockets();

  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(sockets.map(socket => socket.room.user)));
});

const dynamic = io.of(/^\/\w+$/);

dynamic.use(async (socket, next) => {
  const handshake = socket.handshake;

  try {
    switch (socket.nsp.name) {
      case '/user':
        if (handshake.auth['token'] || handshake.headers['cookie']) {
          socket.user = await rest.fetchUser(handshake.auth['token'], handshake.headers['cookie']);
        }

        break;
      default:
        if (handshake.auth['code']) {
          socket.room = await rest.fetchRoom(`${socket.nsp.name}:${handshake.auth['code']}`,
            handshake.auth['token'], handshake.headers['cookie']);
        }
    }
  } catch (error) {}

  if (socket.user || socket.room) {
    next();
  } else {
    next(new Error('Unauthenticated'));
  }
});

dynamic.on('connection', async socket => {
  const nsp = io.of(socket.nsp.name);

  switch (socket.nsp.name) {
    case '/user':
      socket.join(typeof socket.user.id === 'number' ? socket.user.id.toString() : socket.user.id);

      break;
    default:
      socket.on('message', data =>
        nsp.to(socket.room.code).emit('message', {data, user: socket.room.user}));

      socket.on('disconnect', () =>
        nsp.to(socket.room.code).emit('leave', socket.room.user));

      nsp.to(socket.room.code).emit('join', socket.room.user);

      socket.join(socket.room.code);

      socket.emit('users',
        (await nsp.in(socket.room.code).fetchSockets()).map(socket => socket.room.user));
  }
});

http.listen(3000);
