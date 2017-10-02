'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic');

var sequel = require('../../lib/sql/sequel');

var expertises = require('../../lib/tables/expertises'),
    skills = require('../../lib/tables/skills');

module.exports = function(router) {
    var tableName = 'skill';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN skill_is_manifestation ON skill_is_manifestation.skill_id = skill.id ' +
        'LEFT JOIN skill_is_species ON skill_is_species.skill_id = skill.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var sId,
                sName = req.body.name,
                sDescription = req.body.description,
                sIcon = req.body.icon,
                sManifestation = req.body.manifestation_id,
                sSpecies = req.body.species_id;

            var eName = req.body.name,
                eDescription = 'Generic expertise used where the other expertises do not fit, and you still want to show you are extra good at something. You can use the Custom Description field to explain where this is applicable for your character. Remember that if you have a suggestion for a new expertise you can easily add it to the game system and your own created worlds. If the new expertise is of great quality it may even be adopted as canon by Spelwerk.';

            async.series([
                function(callback) {
                    skills.post(req.user, sName, sDescription, sIcon, sManifestation, sSpecies, function(err, id) {
                        if(err) return callback(err);

                        sId = id;

                        callback();
                    })
                },
                function(callback) {
                    expertises.post(req.user, eName, eDescription, sId, sManifestation, sSpecies, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: sId});
            });
        });

    generic.deleted(router, tableName, sql);

    // Manifestation

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

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
