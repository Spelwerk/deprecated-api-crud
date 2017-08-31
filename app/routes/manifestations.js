var async = require('async'),
    yaml = require('node-yaml');

var query = require('./../../lib/sql/query'),
    ownership = require('../../lib/sql/ownership'),
    sequel = require('../../lib/sql/sequel'),
    generic = require('../../lib/sql/generic'),
    comment = require('../../lib/sql/comment'),
    relation = require('./../../lib/sql/relation');

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
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: manifestation.id});
            });
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
