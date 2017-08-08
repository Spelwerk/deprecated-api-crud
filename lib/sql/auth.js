var async = require('async'),
    mysql = require('mysql');

var logger = require(appRoot + '/lib/logger'),
    tokens = require(appRoot + '/lib/tokens'),
    pool = require(appRoot + '/app/initializers/database').getPool();

exports.user = function(req, callback) {
    async.series([
        function(callback) {
            pool.query(mysql.format('SELECT user_id AS id FROM usertoken WHERE token = ?', [req.user.token]), function(err, result) {
                if(!result[0]) return callback('Token missing from database.');

                req.user.id = result[0].id;

                callback(err);
            });
        },
        function(callback) {
            pool.query(mysql.format('SELECT id,admin,verify FROM user WHERE id = ?', [req.user.id]), function(err, result) {
                if(!result[0]) return callback('User missing from database.');

                req.user.admin = result[0].admin;
                req.user.verify = result[0].verify;

                callback(err);
            });
        }
    ],function(err) {
        callback(err);
    });
};

exports.ownership = function(req, adminRequired, tableName, tableId, callback) {
    if(!req.user.token) return callback('User not logged in.');

    if(!req.user.id) return callback('User token invalid.');

    if(adminRequired && !req.user.admin) return callback('User not admin.');

    if(req.user.admin) return callback();

    pool.query(mysql.format('SELECT owner FROM user_has_' + tableName + ' WHERE user_id = ? AND ' + tableName + '_id = ?', [req.user.id, tableId]), function(err, result) {
        req.user.owner = !!result[0];

        if(!req.user.owner) return callback('User forbidden.');

        callback(err);
    });
};
