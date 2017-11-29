'use strict';

let UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

let async = require('async');

let generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    relations = require('../../lib/helper/relations'),
    query = require('../../lib/sql/query');

module.exports = function(router) {
    let tableName = 'world',
        options = { updatedField: true };

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            let world = {
                name: req.body.name,
                description: req.body.description,
                augmentation: req.body.augmentation,
                bionic: req.body.bionic,
                corporation: req.body.corporation,
                manifestation: req.body.manifestation,
                software: req.body.software,
                max_doctrine: req.body.max_doctrine,
                max_expertise: req.body.max_expertise,
                max_skill: req.body.max_skill,
                split_doctrine: req.body.split_doctrine,
                split_expertise: req.body.split_expertise,
                split_milestone: req.body.split_milestone,
                split_skill: req.body.split_skill
            };

            let attributeQuery = 'INSERT INTO world_has_attribute (world_id,attribute_id,value,minimum,maximum) VALUES ',
                skillQuery = 'INSERT INTO world_has_skill (world_id,skill_id) VALUES ';

            async.series([
                function(callback) {
                    elemental.post(req.user, world, 'world', {userOwned: true}, function(err, id) {
                        if(err) return callback(err);

                        world.id = id;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT id,minimum,maximum FROM attribute WHERE optional = 0', null, function(err, results) {
                        if(err) return callback(err);

                        for(let i in results) {
                            attributeQuery += '(' + world.id + ',' + results[i].id + ',' + results[i].minimum + ',' + results[i].minimum + ',' + results[i].maximum + '),';
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

                        for(let i in results) {
                            skillQuery += '(' + world.id + ',' + results[i].id + '),';
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

                res.status(201).send({id: world.id});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.permissions(router, tableName);
    generic.revive(router, tableName);

    // Relations

    relations(router, tableName, 'assets', 'asset');
    relations(router, tableName, 'attributes', 'attribute');
    relations(router, tableName, 'backgrounds', 'background');
    relations(router, tableName, 'bionics', 'bionic');
    relations(router, tableName, 'corporations', 'corporation');
    relations(router, tableName, 'countries', 'country');
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
