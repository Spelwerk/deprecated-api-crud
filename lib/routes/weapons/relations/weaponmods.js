'use strict';

const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'weaponmod';
    const query = 'SELECT ' +
        'weaponmod.id, ' +
        'weaponmod.name, ' +
        'weaponmod.description, ' +
        'weaponmod.icon, ' +
        'weaponmod.short, ' +
        'weaponmod.price, ' +
        'weaponmod.damage_dice, ' +
        'weaponmod.damage_bonus, ' +
        'weaponmod.critical_dice, ' +
        'weaponmod.critical_bonus, ' +
        'weaponmod.hit, ' +
        'weaponmod.hands, ' +
        'weaponmod.distance ' +
        'FROM weapon_has_weaponmod ' +
        'LEFT JOIN weaponmod ON weaponmod.id = weapon_has_weaponmod.weaponmod_id';

    defaults.rootGet(router, 'weapon', table, query);
    defaults.rootPost(router, 'weapon', table);

    defaults.itemGet(router, 'weapon', table, query);
    defaults.itemPut(router, 'weapon', table);
    defaults.itemDelete(router, 'weapon', table);
};