'use strict';

let uuid = require('uuid/v1');

module.exports = function(app, callback) {

    app.use(function(req, res, next) {
        req.log = {
            id: uuid(),
            host: req.headers['host'],
            agent: req.headers['user-agent'],
            method: req.method,
            remoteAddress: req.connection.remoteAddress,
            body: {}
        };

        for(let key in req.body) {
            if(key === 'password') continue;

            req.log.body[key] = req.body[key];
        }

        next();
    });

    callback();
};
