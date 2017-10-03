'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic'),
    sequel = require('../../lib/sql/sequel'),
    expertises = require('../../lib/tables/expertises'),
    weaponTypes = require('../../lib/tables/weapontypes');

module.exports = function(router) {
    var tableName = 'weapontype';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var eId,
                eName = req.body.name + ' Mastery',
                eDescription = req.body.description,
                eSkillId = req.body.skill_id,
                eSpeciesId = req.body.species_id;

            var wId,
                wName = req.body.name,
                wDescription = req.body.description,
                wIcon = req.body.icon,
                wAttributeId = req.body.attribute_id,
                wAugmentation = !!req.body.augmentation,
                wSpecies = !!req.body.species_id;

            async.series([
                function(callback) {
                    expertises.post(req.user, eName, eDescription, eSkillId, null, eSpeciesId, function(err, id) {
                        if(err) return callback(err);

                        eId = id;

                        callback();
                    });
                },
                function(callback) {
                    weaponTypes.post(req.user, wName, wDescription, wIcon, wAttributeId, eId, wAugmentation, wSpecies, function(err, id) {
                        if(err) return callback(err);

                        wId = id;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: wId});
            });
        });

    generic.deleted(router, tableName, sql);

    router.route('/augmentation/:augmentation')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'augmentation = ?';

            sequel.get(req, res, next, call, [req.params.augmentation]);
        });

    router.route('/damage/:damageId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'attribute_id = ?';

            sequel.get(req, res, next, call, [req.params.damageId]);
        });

    router.route('/expertise/:expertiseId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'expertise_id = ?';

            sequel.get(req, res, next, call, [req.params.expertiseId]);
        });

    router.route('/species/:species')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'species = ?';

            sequel.get(req, res, next, call, [req.params.species]);
        });

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
