'use strict';

let UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error'),
    UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

let async = require('async');

let sequel = require('../../lib/helper/sequel'),
    query = require('../../lib/sql/query');

module.exports = function(router) {
    const tableName = 'image';

    let sql = 'SELECT * FROM ' + tableName;

    router.route('/')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            let id = null,
                path = req.body.path;

            async.series([
                function(callback) {
                    query('SELECT id FROM ' + tableName + ' WHERE LOWER(path) = ?', [path.toLowerCase()], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0]) return callback();

                        id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    if(id) return callback();

                    query('INSERT INTO ' + tableName + ' (user_id,path) VALUES (?,?)', [req.user.id, path], function(err, result) {
                        if(err) return callback(err);

                        id = result.insertId;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    router.route('/:id')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    if(!req.user.id) return next(new UserNotLoggedInError);

                    if(req.user.admin) return callback();

                    query('SELECT id FROM image WHERE id = ? AND user_id = ? ', [req.params.id, req.user.id], function(err, result) {
                        if(err) return callback(err);

                        req.user.owner = !!result[0].id;

                        if(!req.user.owner) return callback(new UserNotAdministratorError);

                        callback();
                    });
                },
                function(callback) {
                    query('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/revive')
        .put(function(req, res, next) {
            if(!req.user.admin) return next(new UserNotAdministratorError);

            query('UPDATE ' + tableName + ' SET deleted = NULL WHERE id = ?', [req.params.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};
