'use strict';

let async = require('async');

let generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    relations = require('../../lib/helper/relations');

module.exports = function(router) {
    let tableName = 'augmentation';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            let augmentation = {
                name: req.body.name,
                description: req.body.description,
                legal: !!req.body.legal,
                price: req.body.price,
                hacking_difficulty: req.body.hacking_difficulty,
                corporation_id: req.body.corporation_id
            };

            let weapon = {
                name: req.body.name,
                description: req.body.description,
                weapontype_id: req.body.weapontype_id,
                legal: !!req.body.legal,
                price: req.body.price,
                damage_dice: req.body.damage_dice,
                damage_bonus: req.body.damage_bonus,
                critical_dice: req.body.critical_dice,
                critical_bonus: req.body.critical_bonus,
                distance: req.body.distance
            };

            async.series([
                function(callback) {
                    elemental.post(req.user, augmentation, 'augmentation', null, function(err, id) {
                        if(err) return callback(err);

                        augmentation.id = id;
                        weapon.augmentation_id = id;

                        callback();
                    });
                },
                function(callback) {
                    if(!weapon.weapontype_id) return callback();

                    elemental.post(req.user, weapon, 'weapon', null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: augmentation.id});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);

    // Relations

    relations(router, tableName, 'attributes', 'attribute');
    relations(router, tableName, 'expertises', 'expertise');
    relations(router, tableName, 'skills', 'skill');
    relations(router, tableName, 'software', 'software');
};
