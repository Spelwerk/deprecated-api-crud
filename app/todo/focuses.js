var async = require('async');

var comment = require('../../lib/sql/comment'),
    ownership = require('../../lib/sql/ownership'),
    query = require('../../lib/sql/query'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'focus',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM focus';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'focus.canon = 1 AND ' +
                'focus.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var manifestation = {},
                insert = {};

            manifestation.id = req.body.manifestation_id;

            insert.name = req.body.name;
            insert.description = req.body.description;
            insert.manifestation_id = manifestation.id;
            insert.icon = req.body.icon;

            async.series([
                function(callback) {
                    ownership(req, adminRestriction, 'manifestation', manifestation.id, callback);
                },
                function(callback) {
                    query('INSERT INTO focus (name,description,icon,manifestation_id) VALUES (?,?,?,?)', [insert.name, insert.description, insert.icon, manifestation.id], function(err, result) {
                        if(err) return callback(err);

                        insert.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_has_focus (user_id,focus_id,owner) VALUES (?,?,1)', [req.user.id, insert.id], callback);
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
                'focus.manifestation_id = ? AND ' +
                'focus.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // ID

    router.route('/:focusId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE focus.id = ? AND focus.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.focusId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.focusId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.focusId, adminRestriction);
        });

    router.route('/:focusId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.focusId, useUpdateColumn);
        });

    router.route('/:focusId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.focusId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.focusId);
        });

    router.route('/:focusId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.focusId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};
