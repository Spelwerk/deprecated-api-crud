'use strict';

let AppError = require('../../../lib/errors/app-error');

var nconf = require('nconf'),
    basicAuth = require('basic-auth');

module.exports = function(app, callback) {
    let apiKeyId = nconf.get('api-key:id'),
        apiKeySecret = nconf.get('api-key:secret');

    app.use(function(req, res, next) {
        let credentials = basicAuth(req);

        if(!credentials) return next(new AppError(401, "Missing Credentials", "Credentials are missing in the header"));

        if(credentials.name !== apiKeyId || credentials.pass !== apiKeySecret) return next(new AppError(403, "Faulty API Credentials", "The API key provided was not correct."));

        next();
    });

    callback();
};
