var async = require('async');

var sequel = require('./../../lib/sql/sequel'),
    query = require('./../../lib/sql/query');

module.exports = function(router) {
    'use strict';

    var tableName = 'nicknamegroup';

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

    router.route('/:id/nicknames')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM nicknamegroup_has_nickname ' +
                'LEFT JOIN nickname ON nickname.id = nicknamegroup_has_nickname.nickname_id ' +
                'WHERE ' +
                'nicknamegroup_has_nickname.nicknamegroup_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('INSERT INTO nicknamegroup_has_nickname (nicknamegroup_id,nickname_id) VALUES (?,?)', [req.params.id, req.body.insert_id], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/nicknames/:nickname')
        .delete(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('DELETE FROM nicknamegroup_has_nickname WHERE nicknamegroup_id = ? AND nickname_id = ?', [req.params.id, req.params.nickname], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

};
