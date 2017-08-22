var supertest = require('supertest');

var base = 'http://localhost:4000',
    key = 'key';

var adminToken = '',
    adminEmail = 'admin@spelwerk.se',
    adminPassword = 'admin';

var apiId = 'id',
    apiSecret = 'secret';

exports.login = function(callback) {
    var request = supertest(base);

    request
        .post('/users/login/password')
        .send({
            "email": adminEmail,
            "password": adminPassword
        })
        .auth(apiId, apiSecret)
        .expect(200)
        .end(function(err, res) {
            if(err) return callback(err);

            adminToken = res.body.token;

            callback();
        });
};

exports.get = function(path, token) {
    token = token || adminToken;

    var request = supertest(base);

    return request
        .get(path)
        .auth(apiId, apiSecret)
        .set({
            "x-user-token": token
        });
};

exports.post = function(path, data, token) {
    token = token || adminToken;

    var request = supertest(base);

    data = data || null;

    return request
        .post(path)
        .send(data)
        .auth(apiId, apiSecret)
        .set({
            "x-user-token": token
        });
};

exports.put = function(path, data, token) {
    token = token || adminToken;

    var request = supertest(base);

    data = data || null;

    return request
        .put(path)
        .send(data)
        .auth(apiId, apiSecret)
        .set({
            "x-user-token": token
        });
};

exports.delete = function(path, token) {
    token = token || adminToken;

    var request = supertest(base);

    return request
        .delete(path)
        .auth(apiId, apiSecret)
        .set({
            "x-user-token": token
        });
};