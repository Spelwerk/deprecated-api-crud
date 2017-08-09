var async = require('async');

module.exports = function(app, callback) {

    app.use(function(req, res, next) {
        if(!req.headers['x-user-token']) return next();

        var tokens = require('./../../lib/tokens');

        req.user = {};

        req.user.token = req.headers['x-user-token'];
        req.user.decoded = tokens.decode(req.user.token);

        if(!req.user.decoded) return next({status: 403, message: 'Forbidden', error: 'Token is invalid'});

        req.user.email = req.user.decoded.email;

        var query = require('./../../lib/sql/query');

        async.series([
            function(callback) {
                query('SELECT user_id AS id FROM usertoken WHERE token = ?', [req.user.token], function(err, results) {
                    if(!results[0]) return callback({status: 404, message: 'Missing token', error: 'Token could not be found in table'});

                    req.user.id = results[0].id;

                    callback(err);
                });
            },
            function(callback) {
                query('SELECT id,admin,verify FROM user WHERE id = ?', [req.user.id], function(err, results) {
                    if(!results[0]) return callback({status: 404, message: 'Missing user', error: 'User missing from database'});

                    req.user.admin = results[0].admin;
                    req.user.verify = results[0].verify;

                    callback(err);
                });
            }
        ],function(err) {
            next(err);
        });
    });

    callback();
};
