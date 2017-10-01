'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

var sequel = require('../../lib/sql/sequel');

var augmentations = require('../../lib/tables/augmentations'),
    weapons = require('../../lib/tables/weapons');

module.exports = function(router) {
    var tableName = 'augmentation';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND canon = 1';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            var aId,
                name = req.body.name,
                description = req.body.description,
                legal = req.body.legal,
                price = req.body.price,
                hackingDifficulty = req.body.hacking_difficulty,
                corporationId = req.body.corporation_id;

            var weaponType = req.body.weapon_type || null,
                damageDice = req.body.damage_dice,
                damageBonus = req.body.damage_bonus,
                criticalDice = req.body.critical_dice,
                criticalBonus = req.body.critical_bonus,
                distance = req.body.distance;

            async.series([
                function(callback) {
                    augmentations(req.user, name, description, legal, price, hackingDifficulty, corporationId, function(err, id) {
                        if(err) return callback(err);

                        aId = id;

                        callback();
                    });
                },
                function(callback) {
                    if(!weaponType) return callback();

                    weapons(req.user, name, description, weaponType, legal, price, damageDice, damageBonus, criticalDice, criticalBonus, distance, aId, null, corporationId, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: aId});
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
    generic.images(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);

    // Relations

    relations(router, tableName, 'attributes', 'attribute');
    relations(router, tableName, 'expertises', 'expertise');
    relations(router, tableName, 'skills', 'skill');
    relations(router, tableName, 'software', 'software');
};
