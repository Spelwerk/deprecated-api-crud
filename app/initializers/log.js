'use strict';

var uuid = require('uuid/v4');

module.exports = function(app, callback) {

    app.use(function(req, res, next) {
        req.log = {};

        req.log.id = uuid();

        req.log.host = req.headers['host'];
        req.log.agent = req.headers['user-agent'];
        req.log.accept = req.headers['accept'];
        req.log.authorization = req.headers['authorization'];
        req.log.connection = req.headers['connection'];

        req.log.method = req.method;
        req.log.remoteAddress = req.connection.remoteAddress;

        req.log.body = {};

        for(var key in req.body) {
            if(key === 'password') continue;

            req.log.body[key] = req.body[key];
        }

        //console.log(req.log);

        next();
    });

    callback();
};
