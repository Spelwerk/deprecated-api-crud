'use strict';

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    var tableName = 'weapon',
        options = {
            userOwned: true,
            updatedField: true
        };

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

    generic.root(router, tableName, sql);
    generic.post(router, tableName, options);
    generic.deleted(router, tableName, sql);

    router.route('/augmentation/:augmentationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapon.deleted IS NULL AND ' +
                'augmentation_id = ?';

            sequel.get(req, res, next, call, [req.params.augmentationId]);
        });

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapon.deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapon.deleted IS NULL AND ' +
                'weapontype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
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
