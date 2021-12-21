const axios = require('axios');
const endpoint = process.env.USER_ENDPOINT || 'http://localhost/restful/v1/user/profile';

module.exports = {
    fetchUserByToken: async function(token) {
        return (await axios.get(endpoint, {
            params: {token},
            headers: {
                Authorization: 'Bearer ' + token
            }
        })).data;
    },
    fetchUserByCookie: async function(Cookie) {
        return (await axios.get(endpoint, {headers: {Cookie}})).data;
    }
};