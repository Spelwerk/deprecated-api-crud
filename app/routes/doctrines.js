var async = require('async');

var query = require('./../../lib/sql/query'),
    ownership = require('../../lib/sql/ownership'),
    sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic');

module.exports = function(router) {
    'use strict';

    var tableName = 'doctrine';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var manifestation = {},
                skill = {},
                expertise = {},
                doctrine = {};

            manifestation.id = req.body.manifestation_id;

            expertise.name = req.body.name + ' Mastery';

            doctrine.name = req.body.name;
            doctrine.description = req.body.description;
            doctrine.manifestation_id = manifestation.id;
            doctrine.icon = req.body.icon;

            async.series([
                function(callback) {
                    ownership(req, manifestation.id, callback);
                },

                // SKILL

                function(callback) {
                    query('SELECT generic_id AS id FROM skill WHERE manifestation_id = ?', [manifestation.id], function(err, results) {
                        if(err) return callback(err);

                        skill.id = results[0].id;

                        callback();
                    });
                },

                // EXPERTISE

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description) VALUES (?,?,?)', [req.user.id, doctrine.name, doctrine.description], function(err, result) {
                        if(err) return callback(err);

                        expertise.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO expertise (generic_id,skill_id,manifestation_id) VALUES (?,?,?)', [expertise.id, skill.id, manifestation.id], callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, expertise.id], callback);
                },

                // DOCTRINE

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description,icon) VALUES (?,?,?,?)', [req.user.id, doctrine.name, doctrine.description, doctrine.icon], function(err, result) {
                        if(err) return callback(err);

                        doctrine.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO doctrine (generic_id,expertise_id,manifestation_id) VALUES (?,?,?)', [doctrine.id, expertise.id, manifestation.id], callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, doctrine.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: doctrine.id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    // Manifestations

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.clone(router, tableName);
    basic.comments(router);
    basic.images(router);
    basic.labels(router);
    basic.ownership(router);
    basic.revive(router);
};
