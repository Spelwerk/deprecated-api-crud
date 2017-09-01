var async = require('async');

var query = require('./../../lib/sql/query'),
    sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic');

module.exports = function(router) {
    'use strict';

    var tableName = 'weapontype';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var expertise = {},
                weapontype = {};

            expertise.name = req.body.name + ' Mastery';

            weapontype.name = req.body.name;
            weapontype.description = req.body.description;

            weapontype.augmentation = req.body.augmentation_id;
            weapontype.damage = req.body.damage_id;
            weapontype.skill = req.body.skill_id;
            weapontype.species = req.body.species_id;

            async.series([

                // EXPERTISE

                function(callback) {
                    query('INSERT INTO generic (user_id,name) VALUES (?,?)', [req.user.id, expertise.name], function(err, result) {
                        if(err) return callback(err);

                        expertise.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO expertise (generic_id,skill_id) VALUES (?,?)', [expertise.id, weapontype.skill], callback);
                },

                // WEAPONTYPE

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description) VALUES (?,?,?)', [req.user.id, weapontype.name, weapontype.description], function(err, result) {
                        if(err) return callback(err);

                        weapontype.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO weapontype (generic_id,skill_id,expertise_id,damage_id,augmentation_id,species_id) VALUES (?,?,?,?,?,?)', [weapontype.id, weapontype.skill, expertise.id, weapontype.damage, weapontype.augmentation, weapontype.species], callback);
                },

                // USER SAVE

                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, weapontype.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: weapontype.id});
            });
        });
    
    // Augmentation

    router.route('/augmentation/:augmentationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'augmentation_id = ?';

            sequel.get(req, res, next, call, [req.params.augmentationId]);
        });

    // Damage
    
    router.route('/damage/:damageId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'damage_id = ?';

            sequel.get(req, res, next, call, [req.params.damageId]);
        });

    // Expertise
    
    router.route('/expertise/:expertiseId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'expertise_id = ?';

            sequel.get(req, res, next, call, [req.params.expertiseId]);
        });

    // Skill
    
    router.route('/skill/:skillId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'skill_id = ?';

            sequel.get(req, res, next, call, [req.params.skillId]);
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
};
