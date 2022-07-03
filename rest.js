const axios = require('axios');
const user_endpoint = process.env.USER_ENDPOINT || 'http://localhost/restful/v1/user/profile/';
const room_endpoint = process.env.ROOM_ENDPOINT || 'http://localhost/restful/v1/chat/bearer/';

module.exports = {
    fetchRoomByCode: async function(code) {
        return (await axios.get(room_endpoint, {params: {code}})).data;
    },
    fetchUserByToken: async function(token) {
        return (await axios.get(user_endpoint, {
            params: {token},
            headers: {
                Authorization: 'Bearer ' + token
            }
        })).data;
    },
    fetchUserByCookie: async function(Cookie) {
        return (await axios.get(user_endpoint, {headers: {Cookie}})).data;
    }
};