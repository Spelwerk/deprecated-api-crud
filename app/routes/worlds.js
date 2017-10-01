'use strict';

var async = require('async'),
    yaml = require('node-yaml');

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

var query = require('../../lib/sql/query'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    var tableName = 'world';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var worldId,

                name = req.body.name,
                description = req.body.description || null,

                augmentation = !!req.body.augmentation,
                bionic = !!req.body.bionic,
                corporation = !!req.body.corporation,
                manifestation = !!req.body.manifestation,
                software = !!req.body.software,

                maxDoctrine = parseInt(req.body.max_doctrine),
                maxExpertise = parseInt(req.body.max_expertise),
                maxSkill = parseInt(req.body.max_skill),

                splitDoctrine = parseInt(req.body.split_doctrine),
                splitExpertise = parseInt(req.body.split_expertise),
                splitMilestone = parseInt(req.body.split_milestone),
                splitSkill = parseInt(req.body.split_skill);

            var attributeQuery = 'INSERT INTO world_has_attribute (world_id,attribute_id,value) VALUES ',
                skillQuery = 'INSERT INTO world_has_skill (world_id,skill_id) VALUES ';

            async.series([
                function(callback) {
                    var sql = 'INSERT INTO world (user_id,name,description,augmentation,bionic,corporation,manifestation,' +
                        'software,max_doctrine,max_expertise,max_skill,split_doctrine,split_expertise,' +
                        'split_milestone,split_skill) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

                    var array = [req.user.id, name, description, augmentation, bionic, corporation, manifestation, software,
                        maxDoctrine, maxExpertise, maxSkill, splitDoctrine, splitExpertise, splitMilestone,
                        splitSkill];

                    query(sql, array, function(err, result) {
                        if(err) return callback(err);

                        worldId = result.insertId;

                        callback();
                    });
                },

                function(callback) {
                    query('SELECT id,value FROM attribute WHERE optional = 0', null, function(err, results) {
                        if(err) return callback(err);

                        for(var i in results) {
                            attributeQuery += '(' + worldId + ',' + results[i].id + ',' + results[i].value + '),';
                        }

                        attributeQuery = attributeQuery.slice(0, -1);

                        callback();
                    });
                },
                function(callback) {
                    query(attributeQuery, null, callback);
                },

                function(callback) {
                    query('SELECT id FROM skill WHERE optional = 0', null, function(err, results) {
                        if(err) return callback(err);

                        for(var i in results) {
                            skillQuery += '(' + worldId + ',' + results[i].id + '),';
                        }

                        skillQuery = skillQuery.slice(0, -1);

                        callback();
                    });
                },
                function(callback) {
                    query(skillQuery, null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: worldId});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    // ID

    generic.id(router, sql, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);

    // Relations

    relations(router, tableName, 'assets', 'asset');
    relations(router, tableName, 'attributes', 'attribute');
    relations(router, tableName, 'backgrounds', 'background');
    relations(router, tableName, 'bionics', 'bionic');
    relations(router, tableName, 'corporations', 'corporation');
    relations(router, tableName, 'countries', 'country');
    relations(router, tableName, 'doctrines', 'doctrine');
    relations(router, tableName, 'expertises', 'expertise');
    relations(router, tableName, 'gifts', 'gift');
    relations(router, tableName, 'identities', 'identity');
    relations(router, tableName, 'imperfections', 'imperfection');
    relations(router, tableName, 'locations', 'location');
    relations(router, tableName, 'manifestations', 'manifestation');
    relations(router, tableName, 'milestones', 'milestone');
    relations(router, tableName, 'natures', 'nature');
    relations(router, tableName, 'protection', 'protection');
    relations(router, tableName, 'skills', 'skill');
    relations(router, tableName, 'software', 'software');
    relations(router, tableName, 'species', 'species');
    relations(router, tableName, 'wealth', 'wealth');
    relations(router, tableName, 'weapons', 'weapon');
};
