var async = require('async');

var sequel = require('../../lib/sql/sequel'),
    query = require('../../lib/sql/query');

module.exports = function(router) {
    'use strict';

    var tableName = 'firstname';

    var sql = 'SELECT * FROM ' + tableName;

    router.route('/')
        .get(function(req, res, next) {
            sequel.get(req, res, next, sql);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var id = null,
                name = req.body.name,
                feminine = req.body.feminine;

            async.series([
                function(callback) {
                    query('SELECT id FROM ' + tableName + ' WHERE UPPER(name) = ?', [name.toUpperCase()], function(err, results) {
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
            var call = sql + ' WHERE id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .delete(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator'});

            query('DELETE FROM ' + tableName + ' WHERE id = ?', [req.params.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};