var async = require('async'),
    yaml = require('node-yaml');

var query = require('./../../lib/sql/query'),
    sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic');

var defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    'use strict';

    var tableName = 'manifestation';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var manifestation = {},
                attribute = {},
                skill = {};

            manifestation.name = req.body.name;
            manifestation.description = req.body.description;
            manifestation.icon = req.body.icon;

            attribute.name = req.body.power;
            attribute.type = defaults.attributes.types.power;
            attribute.maximum = req.body.maximum || defaults.manifestation.power.maximum;

            skill.name = req.body.skill;

            async.series([

                // MANIFESTATION

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description,icon) VALUES (?,?,?,?)', [req.user.id, manifestation.name, manifestation.description, manifestation.icon], function(err, result) {
                        if(err) return callback(err);

                        manifestation.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO manifestation (generic_id) VALUES (?)', [manifestation.id], callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, manifestation.id], callback);
                },

                // SKILL

                function(callback) {
                    query('INSERT INTO generic (user_id,name,icon) VALUES (?,?,?)', [req.user.id, skill.name, manifestation.icon], function(err, result) {
                        if(err) return callback(err);

                        skill.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO skill (generic_id,manifestation_id) VALUES (?,?)', [skill.id, manifestation.id], callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, skill.id], callback);
                },

                // ATTRIBUTE

                function(callback) {
                    query('INSERT INTO generic (user_id,name,icon) VALUES (?,?,?)', [req.user.id, attribute.name, manifestation.icon], function(err, result) {
                        if(err) return callback(err);

                        attribute.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO attribute (generic_id,attributetype_id,manifestation_id,maximum) VALUES (?,?,?,?)', [attribute.id, attribute.type, manifestation.id, attribute.maximum], callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, attribute.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: manifestation.id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
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
