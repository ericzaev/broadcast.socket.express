const axios = require('axios');
const user_endpoint = process.env.USER_ENDPOINT || 'http://localhost/restful/v1/services/socket/user/auth/';
const room_endpoint = process.env.ROOM_ENDPOINT || 'http://localhost/restful/v1/services/socket/room/auth/';

module.exports = {
  fetchUser: async function(token, cookie) {
    const headers = {};

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    if (cookie) {
      headers['Cookie'] = cookie;
    }

    return (await axios.get(user_endpoint, {params: {token}, headers})).data;
  },
  fetchRoom: async function(code, token, cookie) {
    const headers = {};

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    if (cookie) {
      headers['Cookie'] = cookie;
    }

    return (await axios.get(room_endpoint, {params: {code}, headers})).data;
  },
};
