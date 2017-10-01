var async = require('async'),
    yaml = require('node-yaml');

var query = require('../../lib/sql/query'),
    sequel = require('../../lib/sql/sequel');

var basic = require('../../lib/generic/basic'),
    relations = require('../../lib/helper/relations');

var defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    'use strict';

    var tableName = 'world';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var generic = {},
                world = [];

            generic.name = req.body.name;
            generic.description = req.body.description;

            world.augmentation = req.body.augmentation || 0;
            world.bionic = req.body.bionic || 0;
            world.manifestation = req.body.manifestation || 0;
            world.software = req.body.software || 0;

            world.split_doctrine = req.body.split_doctrine || 0;
            world.split_expertise = req.body.split_expertise || 0;
            world.split_milestone = req.body.split_milestone || 0;
            world.split_relationship = req.body.split_relationship || 0;
            world.split_skill = req.body.split_skill || 0;

            world.max_doctrine = req.body.max_doctrine || 0;
            world.max_expertise = req.body.max_expertise || 0;
            world.max_gift = req.body.max_gift || 0;
            world.max_imperfection = req.body.max_imperfection || 0;
            world.max_milestone = req.body.max_milestone || 0;
            world.max_relationship = req.body.max_relationship || 0;
            world.max_skill = req.body.max_skill || 0;

            async.series([

                // WORLD

                function(callback) {
                    var call = 'INSERT INTO generic (user_id,name,description) VALUES (?,?,?)';

                    var params = [req.user.id, generic.name, generic.description];

                    query(call, params, function(err, result) {
                        if(err) return callback(err);

                        world.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    var call = 'INSERT INTO world (generic_id, augmentation, bionic, manifestation, software, ' +
                        'split_doctrine, split_expertise, split_milestone, split_relationship, split_skill, ' +
                        'max_doctrine, max_expertise, max_gift, max_imperfection, max_milestone, max_relationship, ' +
                        'max_skill) VALUES ' +
                        '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

                    var params = [world.id, world.augmentation, world.bionic, world.manifestation, world.software,
                        world.split_doctrine, world.split_expertise, world.split_milestone, world.split_relationship,
                        world.split_skill, world.max_doctrine, world.max_expertise, world.max_gift,
                        world.max_imperfection, world.max_milestone, world.max_relationship, world.max_skill];

                    query(call, params, callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, world.id], callback);
                }
                /*
                ,

                // ATTRIBUTES

                function(callback) {
                    var defaultAttributes = [],
                        call = 'INSERT INTO generic_has_generic (generic_id,relation_id,value) VALUES ';

                    defaultAttributes.push({attribute_id: defaults.resilience, default_value: 8});
                    defaultAttributes.push({attribute_id: defaults.stamina, default_value: 8});
                    defaultAttributes.push({attribute_id: defaults.tolerance, default_value: 8});
                    defaultAttributes.push({attribute_id: defaults.initiative, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.speed, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.disease, default_value: 2});
                    defaultAttributes.push({attribute_id: defaults.sanity, default_value: 2});
                    defaultAttributes.push({attribute_id: defaults.trauma, default_value: 4});
                    defaultAttributes.push({attribute_id: defaults.ballistic, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.bashing, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.piercing, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.slashing, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.damage, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.honor, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.infamy, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.ammunition, default_value: 1});
                    defaultAttributes.push({attribute_id: defaults.money, default_value: 1});
                    defaultAttributes.push({attribute_id: defaults.rations, default_value: 1});
                    defaultAttributes.push({attribute_id: defaults.experience, default_value: 0});
                    defaultAttributes.push({attribute_id: defaults.energy, default_value: 0});

                    for(var i in defaultAttributes) {
                        call += '(' + world.id + ',' + defaultAttributes[i].attribute_id + ',' + defaultAttributes[i].default_value + '),';
                    }

                    call = call.slice(0, -1);

                    query(call, null, callback);
                },

                // SKILLS

                function(callback) {
                    var defaultSkills = [],
                        call = 'INSERT INTO generic_has_generic (generic_id,relation_id) VALUES ';

                    defaultSkills.push({skill_id: defaults.agility});
                    defaultSkills.push({skill_id: defaults.awareness});
                    defaultSkills.push({skill_id: defaults.communication});
                    defaultSkills.push({skill_id: defaults.cooking});
                    defaultSkills.push({skill_id: defaults.craft});
                    defaultSkills.push({skill_id: defaults.creativity});
                    defaultSkills.push({skill_id: defaults.education});
                    defaultSkills.push({skill_id: defaults.guile});
                    defaultSkills.push({skill_id: defaults.melee});
                    defaultSkills.push({skill_id: defaults.mending});
                    defaultSkills.push({skill_id: defaults.projectiles});
                    defaultSkills.push({skill_id: defaults.survival});
                    defaultSkills.push({skill_id: defaults.toughness});
                    defaultSkills.push({skill_id: defaults.will});

                    for(var i in defaultSkills) {
                        call += '(' + world.id + ',' + defaultSkills[i].skill_id + '),';
                    }

                    call = call.slice(0, -1);

                    query(call, null, callback);
                }
                */
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: world.id});
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

    // Relations

    relations(router, 'assets', 'asset');
    relations(router, 'attributes', 'attribute');
    relations(router, 'backgrounds', 'background');
    relations(router, 'bionics', 'bionic');
    relations(router, 'countries', 'country');
    relations(router, 'doctrines', 'doctrine');
    relations(router, 'expertises', 'expertise');
    relations(router, 'gifts', 'gift');
    relations(router, 'identities', 'identity');
    relations(router, 'imperfections', 'imperfection');
    relations(router, 'manifestations', 'manifestation');
    relations(router, 'milestones', 'milestone');
    relations(router, 'natures', 'nature');
    relations(router, 'protection', 'protection');
    relations(router, 'skills', 'skill');
    relations(router, 'software', 'software');
    relations(router, 'species', 'species');
    relations(router, 'weapons', 'weapon');
};
