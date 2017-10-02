'use strict';

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

var sequel = require('../../lib/sql/sequel');

var weapons = require('../../lib/tables/weapons');

module.exports = function(router) {
    var tableName = 'weapon';

    var sql = 'SELECT ' +
        'weapon.id, ' +
        'weapon.user_id, ' +
        'weapon.canon, ' +
        'weapon.name, ' +
        'weapon.description, ' +
        'weapon.weapontype_id, ' +
        'weapon.legal, ' +
        'weapon.price, ' +
        'weapon.damage_dice, ' +
        'weapon.damage_bonus, ' +
        'weapon.critical_dice, ' +
        'weapon.critical_bonus, ' +
        'weapon.distance, ' +
        'weapon.created, ' +
        'weapon.updated, ' +
        'weapon.deleted, ' +
        'weapontype.icon, ' +
        'weapontype.attribute_id, ' +
        'weapontype.expertise_id, ' +
        'weapon_is_copy.original_id, ' +
        'weapon_is_augmentation.augmentation_id, ' +
        'weapon_is_species.species_id, ' +
        'weapon_is_corporation.corporation_id ' +
        'FROM weapon ' +
        'LEFT JOIN weapontype ON weapontype.id = weapon.weapontype_id ' +
        'LEFT JOIN weapon_is_copy ON weapon_is_copy.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_augmentation ON weapon_is_augmentation.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_species ON weapon_is_species.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_corporation ON weapon_is_corporation.weapon_id = weapon.id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapon.deleted IS NULL AND weapon.canon = 1';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            var name = req.body.name,
                description = req.body.description,
                typeId = req.body.weapontype_id,
                legal = req.body.legal,
                price = req.body.price,
                damageDice = req.body.damage_dice,
                damageBonus = req.body.damage_bonus,
                criticalDice = req.body.critical_dice,
                criticalBonus = req.body.critical_bonus,
                distance = req.body.distance,
                augmentationId = req.body.augmentation_id,
                speciesId = req.body.species_id,
                corporationId = req.body.corporation_id;

            weapons.post(req.user, name, description, typeId, legal, price, damageDice, damageBonus, criticalDice, criticalBonus, distance, augmentationId, speciesId, corporationId, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapon.deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    // Augmentation

    router.route('/augmentation/:augmentationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapon.deleted IS NULL AND ' +
                'augmentation_id = ?';

            sequel.get(req, res, next, call, [req.params.augmentationId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapon.deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // Types

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapon.deleted IS NULL AND ' +
                'weapontype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
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
    relations(router, tableName, 'doctrines', 'doctrine');
    relations(router, tableName, 'mods', 'weaponmod');
    relations(router, tableName, 'skills', 'skill');
};
