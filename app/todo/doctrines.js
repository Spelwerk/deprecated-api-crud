var async = require('async');

var comment = require('../../lib/sql/comment'),
    ownership = require('../../lib/sql/ownership'),
    query = require('../../lib/sql/query'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'doctrine',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM doctrine';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'doctrine.canon = 1 AND ' +
                'doctrine.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var manifestation = {},
                expertise = {},
                insert = {};

            manifestation.id = req.body.manifestation_id;

            expertise.name = req.body.name + ' Mastery';

            insert.name = req.body.name;
            insert.description = req.body.description;
            insert.manifestation_id = manifestation.id;
            insert.icon = req.body.icon;
            insert.affected = 0;

            async.series([
                function(callback) {
                    query('SELECT * FROM manifestation WHERE id = ?', [manifestation.id], function(err, result) {
                        if(err) return callback(err);

                        manifestation.skill = result[0].skill_id;

                        callback();
                    });
                },
                function(callback) {
                    if(req.user.admin) return callback();

                    query('SELECT owner FROM user_has_manifestation WHERE user_id = ? AND manifestation_id = ?', [req.user.id, manifestation.id], function(err, result) {
                        if(err) return callback(err);

                        req.user.owner = !!result[0];

                        if(!req.user.owner) return callback({status: 403, message: 'Forbidden', error: 'User is not administrator and not owner of the manifestation'});

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO expertise (name,description,skill_id,manifestation_id) VALUES (?,?,?,?)', [expertise.name, insert.description, manifestation.skill, manifestation.id], function(err, result) {
                        if(err) return callback(err);

                        expertise.id = result.insertId;

                        callback();
                    })
                },
                function(callback) {
                    query('INSERT INTO user_has_expertise (user_id,expertise_id,owner) VALUES (?,?,1)', [req.user.id, expertise.id], callback);
                },
                function(callback) {
                    query('INSERT INTO doctrine (name,description,icon,manifestation_id,expertise_id) VALUES (?,?,?,?,?)', [insert.name, insert.description, insert.icon, manifestation.id, expertise.id], function(err, result) {
                        if(err) return callback(err);

                        insert.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_has_doctrine (user_id,doctrine_id,owner) VALUES (?,?,1)', [req.user.id, insert.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: insert.id});
            });
        });

    // Manifestations

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'doctrine.canon = 1 AND ' +
                'doctrine.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // ID

    router.route('/:doctrineId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE doctrine.id = ? AND doctrine.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.doctrineId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.doctrineId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.doctrineId, adminRestriction);
        });

    router.route('/:doctrineId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.doctrineId, useUpdateColumn);
        });

    router.route('/:doctrineId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.doctrineId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.doctrineId);
        });

    router.route('/:doctrineId/ownership')
        .get(function(req, res) {
            ownership(req, req.params.id, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};
