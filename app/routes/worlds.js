'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic'),
    query = require('../../lib/sql/query'),
    relations = require('../../lib/helper/relations'),
    worlds = require('../../lib/tables/worlds');

module.exports = function(router) {
    var tableName = 'world';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var worldId,
                name = req.body.name,
                description = req.body.description,
                augmentation = req.body.augmentation,
                bionic = req.body.bionic,
                corporation = req.body.corporation,
                manifestation = req.body.manifestation,
                software = req.body.software,
                maxDoctrine = req.body.max_doctrine,
                maxExpertise = req.body.max_expertise,
                maxSkill = req.body.max_skill,
                splitDoctrine = req.body.split_doctrine,
                splitExpertise = req.body.split_expertise,
                splitMilestone = req.body.split_milestone,
                splitSkill = req.body.split_skill;

            var attributeQuery = 'INSERT INTO world_has_attribute (world_id,attribute_id,value) VALUES ',
                skillQuery = 'INSERT INTO world_has_skill (world_id,skill_id) VALUES ';

            async.series([
                function(callback) {
                    worlds.post(req.user, name, description, augmentation, bionic, corporation, manifestation, software, maxDoctrine, maxExpertise, maxSkill, splitDoctrine, splitExpertise, splitMilestone, splitSkill, function(err, id) {
                        if(err) return callback(err);

                        worldId = id;

                        callback();
                    })
                },

                function(callback) {
                    query('SELECT id,minimum FROM attribute WHERE optional = 0', null, function(err, results) {
                        if(err) return callback(err);

                        for(var i in results) {
                            attributeQuery += '(' + worldId + ',' + results[i].id + ',' + results[i].minimum + '),';
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

    generic.deleted(router, tableName, sql);

    // ID

    generic.get(router, tableName, sql);
    generic.put(router, tableName, false, true);
    generic.delete(router, tableName, false, true);
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
