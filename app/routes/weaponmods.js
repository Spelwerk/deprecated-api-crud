'use strict';

let generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    const tableName = 'weaponmod';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName);
    generic.deleted(router, tableName, sql);

    router.route('/weapon/:weaponId')
        .get(function(req, res, next) {
            let call = 'SELECT * FROM weapon_has_weaponmod ' +
                'LEFT JOIN weaponmod ON weaponmod.id = weapon_has_weaponmod.weaponmod_id ' +
                'LEFT JOIN weaponmod_is_copy ON weaponmod_is_copy.weaponmod_id = weaponmod.id ' +
                'LEFT JOIN weaponmod_is_corporation ON weaponmod_is_corporation.weaponmod_id = weaponmod.id ' +
                'WHERE weapon_has_weaponmod.weapon_id = ? AND weaponmod.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.weaponId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);

    // Relations

    //relations(router, tableName, 'attributes', 'attribute');

};
