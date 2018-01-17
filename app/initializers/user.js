'use strict';

const UserInvalidTokenError = require('../../lib/errors/user-invalid-token-error');
const UserNotFoundError = require('../../lib/errors/user-not-found-error');

const tokens = require('./../../lib/tokens');
const logger = require('../../lib/logger');
const sql = require('./../../lib/database/sql');

module.exports = (app) => {
    logger.info('[USER] Initializing');

    app.use(async function(req, res, next) {
        req.user = {
            id: null,
            admin: false,
            verified: false
        };

        if(!req.headers['x-user-token']) return next();

        req.user.token = req.headers['x-user-token'];
        req.user.decoded = tokens.decode(req.user.token);

        if(!req.user.decoded) return next(new UserInvalidTokenError);

        req.user.email = req.user.decoded.email;

        try {
            let [rows] = await sql('SELECT user_id AS id FROM user_token WHERE token = ?', [req.user.token]);

            if(!rows || rows.length === 0) return next(new UserInvalidTokenError);

            req.user.id = parseInt(rows[0].id);
        } catch(e) {
            return next(e);
        }

        try {
            let [rows] = await sql('SELECT id,admin,verified FROM user WHERE id = ?', [req.user.id]);

            if(rows.length === 0) return next(new UserNotFoundError);

            req.user.admin = !!rows[0].admin;
            req.user.verified = !!rows[0].verified;
        } catch(e) {
            return next(e);
        }

        next();
    });

};
