var async = require('async');

var tokens = require('../tokens'),
    sequel = require('../sql/sequel'),
    query = require('../sql/query');

module.exports.relation = function(router, routeName, tableName) {
    var sql = 'SELECT * ' +
        'FROM ' + tableName + ' ' +
        'LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id ' +
        'LEFT JOIN user_has_generic ON user_has_generic.generic_id = generic.id ' +
        'WHERE ' +
        'deleted IS NULL';

    router.route('/:id/' + routeName)
        .get(function (req, res, next) {
            var call = sql + ' AND user_has_generic.user_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function (req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, req.body.insert_id], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/' + routeName + '/:relationId')
        .get(function (req, res, next) {
            var call = sql + ' AND ' +
                'user_has_generic.user_id = ? AND ' +
                'user_has_generic.generic_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .delete(function (req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            query('DELETE FROM user_has_generic WHERE user_id = ? AND generic_id = ?', [req.user.id, req.params.relationId], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/' + routeName + '/:relationId/favorite/:favorite')
        .put(function (req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            query('UPDATE user_has_generic SET favorite = ? WHERE user_id = ? AND generic_id = ?', [req.params.favorite, req.user.id, req.params.relationId], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.token = function(req, userId, callback) {
    userId = parseInt(userId);

    var userOS = req.body.os || '',
        userBrowser = req.body.browser || '',
        userIp = req.body.ip || req.connection.remoteAddress,
        userEmail,
        userToken,
        tokenId;

    async.series([
        function(callback) {
            query('SELECT email FROM user WHERE id = ? AND deleted IS NULL', [userId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback({status: 404, message: 'Not found', error: 'User not found in database'});

                userEmail = results[0].email;

                callback();
            });
        },
        function(callback) {
            userToken = tokens.encode(userEmail);

            callback();
        },
        function(callback) {
            query('SELECT id FROM user_token WHERE user_id = ? AND ip = ?', [userId, userIp], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                tokenId = results[0].id;

                callback();
            });
        },
        function(callback) {
            if(!tokenId) return callback();

            query('UPDATE user_token SET token = ?, os = ?, browser = ?, created = CURRENT_TIMESTAMP WHERE id = ?', [userToken, userOS, userBrowser, userId], callback);
        },
        function(callback) {
            if(tokenId) return callback();

            query('INSERT INTO user_token (user_id,token,os,browser,ip) VALUES (?,?,?,?,?)', [userId, userToken, userOS, userBrowser, userIp], callback);
        }
    ], function(err) {
        callback(err, userToken);
    });
};
