`docker run -d -p 3000:3000 --env ACCESS_TOKEN=123456789 --name=broadcast --restart=always eskater/broadcast.socket.express:latest`

### envs

1. SOCKET_PATH=/socket 
2. ACCESS_TOKEN=null 
3. USER_ENDPOINT=http://localhost/restful/v1/user/profile

### expressjs
1. post `/broadcast/events/:user/:event?access_token=123456789` -> `to($user).emit($event, req.body)`

### socket.io client

```
import {Manager} from 'socket.io-client';

const manage = new Manager(null, {path: '/broadcast/socket', withCredentials: true}); // or {auth: {token: ''}}
const socket = manage.socket('/user');

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
        - "USER_ENDPOINT=http://app/restful/v1/user/profile"
    networks:
        - backend
```