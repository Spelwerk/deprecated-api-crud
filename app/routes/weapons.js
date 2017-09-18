var sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic'),
    relations = require('./../../lib/generic/relations');

module.exports = function(router) {
    'use strict';

    var tableName = 'weapon';

    var sql = 'SELECT ' +
        'weapon.generic_id, ' +
        'weapon.weapontype_id, ' +
        'weapon.legal, ' +
        'weapon.price, ' +
        'weapon.damage_dice, ' +
        'weapon.damage_bonus, ' +
        'weapon.critical_dice, ' +
        'weapon.critical_bonus, ' +
        'weapon.hand, ' +
        'weapon.distance, ' +
        'weapontype.damage_id, ' +
        'weapontype.expertise_id, ' +
        'weapontype.skill_id, ' +
        'weapontype.augmentation_id, ' +
        'weapontype.species_id, ' +
        'generic.id, ' +
        'generic.user_id, ' +
        'generic.original_id, ' +
        'generic.canon, ' +
        'generic.name, ' +
        'generic.description, ' +
        'generic.icon, ' +
        'generic.created, ' +
        'generic.updated, ' +
        'generic.deleted ' +
        'FROM weapon ' +
        'LEFT JOIN generic ON generic.id = weapon.generic_id ' +
        'LEFT JOIN weapontype ON weapontype.generic_id = weapon.weapontype_id';

    basic.root(router, sql, tableName);

    // Augmentation

    router.route('/augmentation/:augmentationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'augmentation_id = ?';

            sequel.get(req, res, next, call, [req.params.augmentationId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // Types

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'weapontype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.clone(router, tableName);
    basic.comments(router);
    basic.images(router);
    basic.labels(router);
    basic.ownership(router);
    basic.revive(router);

    // Relations

    relations(router, 'attributes', 'attribute', true);
    relations(router, 'doctrines', 'doctrine', true);
    relations(router, 'expertises', 'expertise', true);
    relations(router, 'mods', 'weaponmod');
    relations(router, 'skills', 'skill', true);
};
