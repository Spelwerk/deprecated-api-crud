var async = require('async');

var query = require('./../../lib/sql/query'),
    ownership = require('../../lib/sql/ownership'),
    sequel = require('../../lib/sql/sequel'),
    generic = require('../../lib/sql/generic'),
    comment = require('../../lib/sql/comment'),
    relation = require('./../../lib/sql/relation');

module.exports = function(router) {
    'use strict';

    var tableName = 'focus';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var manifestation = {},
                focus = {};

            manifestation.id = req.body.manifestation_id;

            focus.name = req.body.name;
            focus.description = req.body.description;
            focus.icon = req.body.icon;

            async.series([
                function(callback) {
                    ownership(req, manifestation.id, callback);
                },
                function(callback) {
                    query('INSERT INTO generic (user_id,name,description,icon) VALUES (?,?,?,?)', [req.user.id, focus.name, focus.description, focus.icon], function(err, result) {
                        if(err) return callback(err);

                        focus.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO focus (generic_id,manifestation_id) VALUES (?,?)', [focus.id, manifestation.id], callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, focus.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: focus.id});
            });
        });

    // Manifestations

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // ID

    router.route('/:id')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .put(function(req, res, next) {
            generic.put(req, res, next, tableName, req.params.id);
        })
        .delete(function(req, res, next) {
            generic.delete(req, res, next, req.params.id);
        });

    router.route('/:id/canon')
        .put(function(req, res, next) {
            generic.canon(req, res, next, req.params.id);
        });

    router.route('/:id/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, req.params.id);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, req.params.id);
        });

    router.route('/:id/ownership')
        .get(function(req, res) {
            ownership(req, req.params.id, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};
