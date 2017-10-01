var async = require('async');

var sequel = require('./../sql/sequel'),
    query = require('./../sql/query');

module.exports = function(router, tableName, adminRestriction) {
    adminRestriction = adminRestriction || false;

    var sql = 'SELECT * FROM ' + tableName;

    router.route('/')
        .get(function(req, res, next) {
            sequel.get(req, res, next, sql);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            if(adminRestriction && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator'});

            var id,
                name = req.body.name.toLowerCase();

            async.series([
                function(callback) {
                    query('SELECT id FROM ' + tableName + ' WHERE LOWER(name) = ?', [name], function(err, results) {
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
};