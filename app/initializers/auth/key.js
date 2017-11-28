'use strict';

let MissingCredentialsError = require('../../../lib/errors/app-missing-credentials-error'),
    InvalidCredentialsError = require('../../../lib/errors/app-invalid-credentials-error');

let nconf = require('nconf'),
    basicAuth = require('basic-auth');

let apiKeyId = nconf.get('api-key:id'),
    apiKeySecret = nconf.get('api-key:secret');

module.exports = function(app, callback) {
    app.use(function(req, res, next) {
        let credentials = basicAuth(req);

        if(!credentials) return next(new MissingCredentialsError);

        if(credentials.name !== apiKeyId || credentials.pass !== apiKeySecret) return next(new InvalidCredentialsError);

        next();
    });

    callback();
};
