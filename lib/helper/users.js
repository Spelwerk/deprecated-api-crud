'use strict';

let UserNotFoundError = require('../../lib/errors/user-not-found-error'),
    UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

let async = require('async'),
    request = require('request');

let tokens = require('../tokens'),
    sequel = require('./sequel'),
    query = require('../sql/query');

module.exports.relation = function(router, routeName, tableName) {
    let user_has_table = 'user_has_' + tableName,
        table_id = tableName + '_id';

    let sql = 'SELECT * ' +
        'FROM ' + user_has_table + ' ' +
        'LEFT JOIN ' + tableName + ' ON ' + tableName + '.id = ' + user_has_table + '.' + table_id;

    router.route('/:id/' + routeName)
        .get(function (req, res, next) {
            let call = sql + ' WHERE ' + user_has_table + '.user_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function (req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            query('INSERT INTO ' + user_has_table + ' (user_id,' + table_id + ') VALUES (?,?)', [req.user.id, req.body.insert_id], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/' + routeName + '/:relationId')
        .get(function (req, res, next) {
            let call = sql + ' WHERE ' +
                user_has_table + '.user_id = ? AND ' +
                user_has_table + '.' + table_id + ' = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.relationId], true);
        })
        .delete(function (req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            query('DELETE FROM user_has_generic WHERE user_id = ? AND generic_id = ?', [req.user.id, req.params.relationId], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

};

module.exports.token = function(userId, object, callback) {
    object.user = parseInt(userId);

    object.ip = object.ip || null;
    object.os = object.os || null;
    object.browser = object.browser || null;

    object.country = null;
    object.city = null;

    async.series([
        function(callback) {
            query('SELECT email FROM user WHERE id = ? AND deleted IS NULL', [object.user], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback(new UserNotFoundError);

                object.email = results[0].email;

                callback();
            });
        },
        function(callback) {
            object.encoded = tokens.encode(object.email);

            callback();
        },
        function(callback) {
            if(!object.ip) return callback();

            request.get({uri: "http://ip-api.com/json/" + object.ip, json: true}, function(err, res, body) {
                if(err) return callback();

                object.country = body.countryCode;
                object.city = body.city;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO user_token (user_id,token,os,browser,ip,country,city) VALUES (?,?,?,?,?,?,?)', [object.user, object.encoded, object.os, object.browser, object.ip, object.country, object.city], callback);
        }
    ], function(err) {
        callback(err, object.encoded);
    });
};
