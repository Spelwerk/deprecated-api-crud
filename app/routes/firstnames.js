'use strict';

let UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error'),
    UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

let async = require('async');

let sequel = require('../../lib/sql/sequel'),
    query = require('../../lib/sql/query');

module.exports = function(router) {
    let tableName = 'firstname';

    let sql = 'SELECT * FROM ' + tableName;

    router.route('/')
        .get(function(req, res, next) {
            sequel.get(req, res, next, sql);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            let id,
                name = req.body.name,
                feminine = req.body.feminine;

            async.series([
                function(callback) {
                    query('SELECT id FROM ' + tableName + ' WHERE LOWER(name) = ?', [name.toLowerCase()], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0]) return callback();

                        id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    if(id) return callback();

                    query('INSERT INTO ' + tableName + ' (name,feminine) VALUES (?,?)', [name, feminine], function(err, result) {
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

    router.route('/:id')
        .get(function(req, res, next) {
            let call = sql + ' WHERE id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .delete(function(req, res, next) {
            if(!req.user.admin) return next(new UserNotAdministratorError);

            query('DELETE FROM ' + tableName + ' WHERE id = ?', [req.params.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};
