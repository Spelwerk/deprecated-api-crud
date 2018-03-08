let supertest = require('supertest');

let base = 'http://localhost:4000';

let adminToken = '',
    adminEmail = 'admin@spelwerk.com',
    adminPassword = 'password';

let apiId = 'id',
    apiSecret = 'secret';

module.exports.login = function(callback) {
    let request = supertest(base);

    request
        .post('/users/login/password')
        .send({
            "email": adminEmail,
            "password": adminPassword
        })
        .auth(apiId, apiSecret)
        .expect(200)
        .end(function(err, res) {
            if (err) return callback(err);

            adminToken = res.body.token;

            callback();
        });
};

module.exports.get = function(path, token) {
    token = token || adminToken;

    let request = supertest(base);

    return request
        .get(path)
        .auth(apiId, apiSecret)
        .set({
            "x-user-token": token
        });
};

module.exports.post = function(path, data, token) {
    token = token || adminToken;

    let request = supertest(base);

    data = data || null;

    return request
        .post(path)
        .send(data)
        .auth(apiId, apiSecret)
        .set({
            "x-user-token": token
        });
};

module.exports.put = function(path, data, token) {
    token = token || adminToken;

    let request = supertest(base);

    data = data || null;

    return request
        .put(path)
        .send(data)
        .auth(apiId, apiSecret)
        .set({
            "x-user-token": token
        });
};

module.exports.delete = function(path, token) {
    token = token || adminToken;

    let request = supertest(base);

    return request
        .delete(path)
        .auth(apiId, apiSecret)
        .set({
            "x-user-token": token
        });
};

module.exports.randomNumber = function(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
};
