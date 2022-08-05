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
  const {nsp, room, event} = request.params;

  io.of(nsp).to(room).emit(event, nsp === 'user' ? request.body : {data: request.body, room});

  response.end();
});

app.get('/:nsp/:room/users', async (request, response) => {
  const sockets = await io.of(request.params.nsp).in(request.params.room).fetchSockets();

  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(sockets.map(socket => socket.room.user)));
});

const dynamic = io.of(/^\/\w+$/);

dynamic.use(async (socket, next) => {
  socket.user = {id: null, name: null};

  try {
    socket.user = await rest.fetchUser(socket.handshake.auth['token'], socket.handshake.headers['cookie']);
  } catch (error) {}

  if (socket.user.id || socket.nsp.name !== '/user') {
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
      socket.on('join', async code => {
        try {
          await rest.fetchRoom(`${socket.nsp.name}:${code}`,
            socket.handshake.auth['token'], socket.handshake.headers['cookie']);

          socket.emit('users', {data:
            (await nsp.in(code).fetchSockets()).map(socket => socket.user), room: code});
          socket.join(code);

          nsp.to(code).emit('join', {data: socket.user, room: code});
        } catch ({message}) {
          socket.emit(`${socket.nsp.name}-error`, {room: code, message});
        }
      });

      socket.on('message', data => {
        if (data.room) {
          nsp.to(data.room).emit('message', {data, room: data.room, user: socket.user});
        }
      });

      socket.on('disconnect', () => nsp.emit('leave', socket.user));
  }
});

http.listen(3000);
