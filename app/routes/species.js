'use strict';

var async = require('async'),
    yaml = require('node-yaml');

var query = require('./../../lib/sql/query'),
    sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic'),
    relations = require('./../../lib/generic/relations');

var defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    var tableName = 'species';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var defaultWeaponName = req.body.weapon || 'Brawl',
                defaultWeaponDescription = 'Unarmed combat for the species: ' + req.body.name,
                defaultDamageAttribute = defaults.attributes.bashing,
                defaultSkillId = defaults.skills.melee;

            var species = {},
                expertise = {},
                weapontype = {},
                weapon = {};

            species.name = req.body.name;
            species.description = req.body.description || null;
            species.icon = req.body.icon || null;

            species.playable = req.body.playable || 0;
            species.manifestation = req.body.manifestation || 0;
            species.max_age = req.body.max_age;
            species.multiply_doctrine = req.body.multiply_doctrine || 1;
            species.multiply_expertise = req.body.multiply_expertise || 1;
            species.multiply_skill = req.body.multiply_skill || 1;

            expertise.name = defaultWeaponName + ' Mastery';
            expertise.description = 'Expertise for ' + defaultWeaponDescription;

            weapontype.name = 'Unarmed ' + defaultWeaponName;
            weapontype.description = 'Weapon Type for ' + defaultWeaponDescription;

            weapon.name = defaultWeaponName;
            weapon.description = defaultWeaponDescription;
            weapon.legal = 1;
            weapon.damage_dice = 2;
            weapon.critical_dice = 1;

            async.series([

                // SPECIES

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description,icon) VALUES (?,?,?,?)', [req.user.id, species.name, species.description, species.icon], function(err, result) {
                        if(err) return callback(err);

                        species.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    var call = 'INSERT INTO species (generic_id,playable,manifestation,max_age,multiply_doctrine,multiply_expertise,multiply_skill) VALUES (?,?,?,?,?,?,?)';

                    var params = [species.id, species.playable, species.manifestation, species.max_age, species.multiply_doctrine, species.multiply_expertise, species.multiply_skill];

                    query(call, params, callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, species.id], callback);
                },

                // EXPERTISE

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description) VALUES (?,?,?)', [req.user.id, expertise.name, expertise.description], function(err, result) {
                        if(err) return callback(err);

                        expertise.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO expertise (generic_id,skill_id,species_id) VALUES (?,?,?)', [expertise.id, defaultSkillId, species.id], callback);
                },

                // WEAPON TYPE

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description) VALUES (?,?,?)', [req.user.id, weapontype.name, weapontype.description], function(err, result) {
                        if(err) return callback(err);

                        weapontype.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO weapontype (generic_id,damage_id,expertise_id,skill_id,species_id) VALUES (?,?,?,?,?)', [weapontype.id, defaultDamageAttribute, expertise.id, defaultSkillId, species.id], callback);
                },

                // WEAPON

                function(callback) {
                    query('INSERT INTO generic (user_id,name,description) VALUES (?,?,?)', [req.user.id, weapon.name, weapon.description], function(err, result) {
                        if(err) return callback(err);

                        weapon.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO weapon (generic_id,weapontype_id,legal,damage_dice,critical_dice) VALUES (?,?,?,?,?)', [weapon.id, weapontype.id, weapon.legal, weapon.damage_dice, weapon.critical_dice], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: species.id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    // Playable

    router.route('/playable/:playable')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'playable = ?';

            sequel.get(req, res, next, call, [req.params.playable]);
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

    // Relations

    relations(router, 'bodyparts', 'bodypart');
    relations(router, 'attributes', 'attribute');
};
