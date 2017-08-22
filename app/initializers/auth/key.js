'use strict';

var nconf = require('nconf'),
    basicAuth = require('basic-auth');

module.exports = function(app, callback) {
    var apiKeyId = nconf.get('api-key:id'),
        apiKeySecret = nconf.get('api-key:secret');

    app.use(function(req, res, next) {
        var credentials = basicAuth(req);

        if(!credentials || credentials.name !== apiKeyId || credentials.pass !== apiKeySecret) return next({status: 403, message: 'Faulty API credentials', error: 'The credentials in basic auth were not correct.'});

        next();
    });

    callback();
};
