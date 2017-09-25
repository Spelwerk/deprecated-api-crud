var async = require('async');

var query = require('./../../lib/sql/query'),
    sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic');

module.exports = function(router) {
    'use strict';

    var tableName = 'skill';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var skill = {},
                expertise = {};

            skill.name = req.body.name;
            skill.description = req.body.description || null;
            skill.icon = req.body.icon || null;

            skill.manifestation = req.body.manifestation_id || null;
            skill.species = req.body.species_id || null;

            expertise.description = 'Generic expertise used where the other expertises do not fit, and you still want to show you are extra good at something. You can use the Custom Description field to explain where this is applicable for your character. Remember that if you have a suggestion for a new expertise you can easily add it to the game system and your own created worlds. If the new expertise is of great quality it may even be adopted as canon by Spelwerk.';

            async.series([

                // SKILL

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description,icon) VALUES (?,?,?,?)', [req.user.id, skill.name, skill.description, skill.icon], function(err, result) {
                        if(err) return callback(err);

                        skill.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO skill (generic_id,manifestation_id,species_id) VALUES (?,?,?)', [skill.id, skill.manifestation, skill.species], callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, skill.id], callback);
                },

                // GENERIC EXPERTISE

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description) VALUES (?,?,?)', [req.user.id, skill.name, expertise.description], function(err, result) {
                        if(err) return callback(err);

                        expertise.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO expertise (generic_id,skill_id,manifestation_id,species_id) VALUES (?,?,?,?)', [expertise.id, skill.id, skill.manifestation, skill.species], callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, expertise.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: skill.id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    basic.root(router, sql, tableName);

    // Manifestation

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.clone(router, tableName);
    basic.comments(router);
    basic.labels(router);
    basic.ownership(router);
    basic.revive(router);
};
