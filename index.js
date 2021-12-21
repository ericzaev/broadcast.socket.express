const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {path: process.env.SOCKET_PATH || '/socket', pingTimeout: 10000, pingInterval: 5000});
const rest = require('./rest');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.post('/events/:user/:event', (request, response) => {
  const token = process.env.ACCESS_TOKEN;

  if (token && token === request.query['access_token']) {
    io.of('/user').to(parseInt(request.params.user)).emit(request.params.event, request.body);
  } else {
    response.status(403);
  }

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
    } catch (error) {
      next(new Error('Unauthenticated'));
    }

    if (socket.user) {
      next();
    } else {
      next(new Error('Unauthenticated'));
    }
  }
});

io.of('/user').on('connection', socket => socket.join(socket.user.id));

http.listen(3000);