'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

var augmentations = require('../../lib/tables/augmentations'),
    weapons = require('../../lib/tables/weapons');

module.exports = function(router) {
    var tableName = 'augmentation';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
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
                    augmentations.post(req.user, name, description, legal, price, hackingDifficulty, corporationId, function(err, id) {
                        if(err) return callback(err);

                        aId = id;

                        callback();
                    });
                },
                function(callback) {
                    if(!weaponType) return callback();

                    weapons.post(req.user, name, description, weaponType, legal, price, damageDice, damageBonus, criticalDice, criticalBonus, distance, aId, null, corporationId, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: aId});
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
