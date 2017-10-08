'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    var tableName = 'skill',
        options = { updatedField: true };

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN skill_is_manifestation ON skill_is_manifestation.skill_id = skill.id ' +
        'LEFT JOIN skill_is_species ON skill_is_species.skill_id = skill.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var skill = {
                name: req.body.name,
                description: req.body.description,
                icon: req.body.icon,
                manifestation_id: req.body.manifestation_id,
                species_id: req.body.species_id
            };

            var expertise = {
                name: req.body.name,
                description: 'Generic expertise used where the other expertises do not fit, and you still want to show you are extra good at something. You can use the Custom Description field to explain where this is applicable for your character. Remember that if you have a suggestion for a new expertise you can easily add it to the game system and your own created worlds. If the new expertise is of great quality it may even be adopted as canon by Spelwerk.',
                manifestation_id: req.body.manifestation_id,
                species_id: req.body.species_id
            };

            async.series([
                function(callback) {
                    elemental.post(req.user, skill, 'skill', {userOwned: true, combinations: ['manifestation', 'species']}, function(err, id) {
                        if(err) return callback(err);

                        skill.id = id;
                        expertise.skill_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, expertise, 'expertise', {userOwned: true, combinations: ['manifestation', 'species']}, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: skill.id});
            });
        });

    generic.deleted(router, tableName, sql);

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.permissions(router, tableName);
    generic.revive(router, tableName);
};
