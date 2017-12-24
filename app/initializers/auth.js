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

        if(!credentials) return next(new MissingCredentialsError);

        if(credentials.name !== nconf.get('api-key:id') || credentials.pass !== nconf.get('api-key:secret')) return next(new InvalidCredentialsError);

        next();
    });
};
