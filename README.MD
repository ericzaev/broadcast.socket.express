`docker run -d -p 3000:3000 --env ACCESS_TOKEN=123456789 --name=broadcast --restart=always eskater/broadcast.socket.express:latest`

### envs

1. SOCKET_PATH=/socket 
2. ACCESS_TOKEN=null 
3. USER_ENDPOINT=http://localhost/restful/v1/services/socket/user/auth/
4. ROOM_ENDPOINT=http://localhost/restful/v1/services/socket/room/auth/

### expressjs
1. _post_ `/:nsp/:room/:event/?access_token=123456789` -> `nsp.to($room).emit($event, req.body)` // :nsp - user, chat, etc..
2. _get_ `/:nsp/:room/users/?access_token=123456789` // return current users in room of nsp

### rest

Each endpoint must return data.
1. USER_ENDPOINT: `{id: 666, name: 'my name'}`
2. ROOM_ENDPOINT: `{id: 333, code: '6b5d7bbb-c977-485b-99cd-731478de40ed', user: {id: 666, name: 'my name'}}`

### socket.io client

```
import {Manager} from 'socket.io-client';

const manage = new Manager(null, {path: '/broadcast/socket', withCredentials: true}); // or {auth: {token: ''}}
const socket = manage.socket('/user'); // send request to USER_ENDPOINT for access
const socket = manage.socket('/chat', {auth: {code: $tokenChat}}); // send request to ROOM_ENDPOINT for access

socket.on('connect', () => {

});

socket.on('error', error => {
  console.log(error);
});

socket.on('hello', data => {
  console.log(data);
});
```

### nginx 
```
location /broadcast/ {
  proxy_pass http://broadcast:3000/;

  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header X-NginX-Proxy true;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### docker-compose
```
broadcast:
    image: eskater/broadcast.socket.express:latest
    container_name: app_broadcast
    environment:
        - "ACCESS_TOKEN=${BROADCAST_ACCESS_TOKEN}"
        - "USER_ENDPOINT=http://app/restful/v1/services/socket/user/auth/"
        - "ROOM_ENDPOINT=http://app/restful/v1/services/socket/room/auth/"
    networks:
        - backend
```