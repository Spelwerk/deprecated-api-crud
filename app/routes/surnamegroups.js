var async = require('async');

var sequel = require('./../../lib/sql/sequel'),
    query = require('./../../lib/sql/query');

module.exports = function(router) {
    'use strict';

    var tableName = 'surnamegroup';

    var sql = 'SELECT * FROM ' + tableName;

    router.route('/')
        .get(function(req, res, next) {
            sequel.get(req, res, next, sql);
        })
        .post(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator'});

            var id = null,
                name = req.body.name;

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

                    query('INSERT INTO ' + tableName + ' (name) VALUES (?)', [name], function(err, result) {
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

    router.route('/:id/surnames')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM surnamegroup_has_surname ' +
                'LEFT JOIN surname ON surname.id = surnamegroup_has_surname.surname_id ' +
                'WHERE ' +
                'surnamegroup_has_surname.surnamegroup_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('INSERT INTO surnamegroup_has_surname (surnamegroup_id,surname_id) VALUES (?,?)', [req.params.id, req.body.insert_id], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/surnames/:surname')
        .delete(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('DELETE FROM surnamegroup_has_surname WHERE surnamegroup_id = ? AND surname_id = ?', [req.params.id, req.params.surname], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

};
