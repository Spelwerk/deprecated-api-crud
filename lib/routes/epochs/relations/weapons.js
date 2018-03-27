'use strict';

const basic = require('../../generic/generic');
const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'weapon';

    const query = 'SELECT ' +
        'weapon.id, ' +
        'weapon.canon, ' +
        'weapon.name, ' +
        'weapon.description, ' +
        'weapontype.icon, ' +
        'weapon.legal, ' +
        'weapon.price, ' +
        'weapontype.equipable, ' +
        'weapon.created, ' +
        'weapon.updated, ' +
        'weapontype.id AS type_id, ' +
        'weapontype.name AS type_name, ' +
        'attribute.id AS damage_id, ' +
        'attribute.name AS damage_name, ' +
        'weapon.damage_dice, ' +
        'weapon.damage_bonus, ' +
        'weapon.critical_dice, ' +
        'weapon.critical_bonus, ' +
        'weapon.hit, ' +
        'weapon.hands, ' +
        'weapon.distance ' +
        'FROM epoch_has_weapon ' +
        'LEFT JOIN weapon ON weapon.id = epoch_has_weapon.weapon_id ' +
        'LEFT JOIN weapon_is_augmentation ON weapon_is_augmentation.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_form ON weapon_is_form.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_manifestation ON weapon_is_manifestation.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_species ON weapon_is_species.weapon_id = weapon.id ' +
        'LEFT JOIN weapontype ON weapontype.id = weapon.weapontype_id ' +
        'LEFT JOIN attribute ON attribute.id = weapontype.attribute_id';

    defaults.rootGet(router, 'epoch', table, query);
    defaults.rootPost(router, 'epoch', table);

    router.get('/:id/weapons/type/:type', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_weapon.epoch_id = ? AND ' +
            'weapon.weapontype_id = ? AND ' +
            'weapon_is_augmentation.augmentation_id IS NULL AND ' +
            'weapon_is_form.form_id IS NULL AND ' +
            'weapon_is_manifestation.manifestation_id IS NULL AND ' +
            'weapon_is_species.species_id IS NULL AND ' +
            'weapon.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.type]);
    });

    defaults.itemGet(router, 'epoch', table, query);
    defaults.itemPut(router, 'epoch', table);
    defaults.itemDelete(router, 'epoch', table);
};