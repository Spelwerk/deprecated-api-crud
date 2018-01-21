'use strict';

const UserInvalidTokenError = require('../../lib/errors/user-invalid-token-error');
const UserNotFoundError = require('../../lib/errors/user-not-found-error');

const tokens = require('./../../lib/tokens');
const logger = require('../../lib/logger');
const sql = require('./../../lib/database/sql');

module.exports = (app) => {
    logger.info('[USER] Initializing');

    app.use(async function(req, res, next) {
        try {
            req.user = { id: null, admin: false, verified: false };

            if(!req.headers['x-user-token']) return next();

            req.user.token = req.headers['x-user-token'];
            req.user.decoded = tokens.decode(req.user.token);

            if(!req.user.decoded) throw new UserInvalidTokenError;

            req.user.email = req.user.decoded.email;

            let [r1] = await sql('SELECT user_id AS id FROM user_token WHERE token = ?', [req.user.token]);

            if(!r1 || r1.length === 0) throw new UserInvalidTokenError;

            req.user.id = parseInt(r1[0].id);

            let [r2] = await sql('SELECT id,admin,verified FROM user WHERE id = ?', [req.user.id]);

            if(r2.length === 0) throw new UserNotFoundError;

            req.user.admin = !!r2[0].admin;
            req.user.verified = !!r2[0].verified;
        } catch(e) {
            return next(e);
        }

        next();
    });

};
