var supertest = require('supertest');

var base = 'http://localhost:4000',
    key = 'key';

exports.get = function(path) {
    var request = supertest(base);

    request = request.get(path);

    request.set({
        'x-api-key': key
    });

    return request;
};

exports.post = function(path, data) {
    var request = supertest(base);

    request = request.post(path).send(data);

    request.set({
        'x-api-key': key
    });

    return request;
};

exports.put = function(path, data) {
    var request = supertest(base);

    request = request.put(path).send(data);

    request.set({
        'x-api-key': key
    });

    return request;
};

exports.delete = function(path) {
    var request = supertest(base);

    request = request.delete(path);

    request.set({
        'x-api-key': key
    });

    return request;
};