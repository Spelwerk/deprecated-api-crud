'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic'),
    creatures = require('../../lib/tables/creatures'),
    individuals = require('../../lib/tables/individuals'),
    avatars = require('../../lib/tables/avatars');

module.exports = function(router) {
    var tableName = 'avatar';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN individual ON individual.individual_id = avatar.individual_id ' +
        'LEFT JOIN creature ON creature.id = avatar.individual_id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var avatarId,
                name = req.body.name,
                description = req.body.description,
                worldId = req.body.world_id,
                speciesId = req.body.species_id,
                manifestation = req.body.manifestation,
                age = req.body.age,
                firstName = req.body.firstname,
                lastName = req.body.lastname,
                gender = req.body.gender,
                occupation = req.body.occupation,
                identityId = req.body.identity_id,
                natureId = req.body.nature_id,
                pointDoctrine = req.body.point_doctrine,
                pointExpertise = req.body.point_expertise,
                pointGift = req.body.point_gift,
                pointImperfection = req.body.point_imperfection,
                pointMilestone = req.body.point_milestone,
                pointSkill = req.body.point_skill;

            async.series([
                function(callback) {
                    creatures.post(req.user, name, description, worldId, speciesId, function(err, id) {
                        if(err) return callback(err);

                        avatarId = id;

                        callback();
                    });
                },
                function(callback) {
                    individuals.post(req.user, avatarId, manifestation, age, firstName, lastName, gender, occupation, callback);
                },
                function(callback) {
                    avatars.post(req.user, avatarId, identityId, natureId, pointDoctrine, pointExpertise, pointGift, pointImperfection, pointMilestone, pointSkill, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: avatarId});
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
};
