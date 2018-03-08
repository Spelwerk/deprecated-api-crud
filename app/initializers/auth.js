'use strict';

const MissingCredentialsError = require('../../lib/errors/app-missing-credentials-error');
const InvalidCredentialsError = require('../../lib/errors/app-invalid-credentials-error');

const nconf = require('nconf');
const basicAuth = require('basic-auth');
const logger = require('../../lib/logger');

module.exports = (app) => {
    logger.info('[AUTH] Initializing');

    app.use(function(req, res, next) {
        let credentials = basicAuth(req);
        let keyId = nconf.get('api-key:id');
        let keySecret = nconf.get('api-key:secret');

        if (!credentials) return next(new MissingCredentialsError);

        if (credentials.name !== keyId || credentials.pass !== keySecret) return next(new InvalidCredentialsError);

        next();
    });
};
