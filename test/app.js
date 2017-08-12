var supertest = require('supertest'),
    chai = require('chai');

var base = 'http://localhost:4000',
    key = 'key';

var adminToken = '',
    adminEmail = 'admin@spelwerk.se',
    adminPassword = 'admin';

exports.login = function(callback) {
    var request = supertest(base);

    request
        .post('/users/login/password')
        .send({
            "email": adminEmail,
            "password": adminPassword
        })
        .set({
            "x-api-key": key
        })
        .expect(200)
        .end(function(err, res) {
            if(err) callback(err);

            adminToken = res.body.token;

            callback();
        });
};

exports.get = function(path) {
    var request = supertest(base);

    return request
        .get(path)
        .set({
            "x-api-key": key,
            "x-user-token": adminToken
        });
};

exports.post = function(path, data) {
    var request = supertest(base);

    data = data || null;

    return request
        .post(path)
        .send(data)
        .set({
            "x-api-key": key,
            "x-user-token": adminToken
        });
};

exports.put = function(path, data) {
    var request = supertest(base);

    data = data || null;

    return request
        .put(path)
        .send(data)
        .set({
            "x-api-key": key,
            "x-user-token": adminToken
        });
};

exports.delete = function(path) {
    var request = supertest(base);

    return request
        .delete(path)
        .set({
            "x-api-key": key,
            "x-user-token": adminToken
        });
};