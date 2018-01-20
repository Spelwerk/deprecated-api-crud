'use strict';

const routes = require('../../lib/generic/routes');
const basic = require('../../lib/generic/basics');

module.exports = (router) => {
    const tableName = 'weaponmod';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/weapon/:id')
        .get(async (req, res, next) => {
            let call = 'SELECT * FROM weapon_has_weaponmod ' +
                'LEFT JOIN weaponmod ON weaponmod.id = weapon_has_weaponmod.weaponmod_id ' +
                'LEFT JOIN weaponmod_is_copy ON weaponmod_is_copy.weaponmod_id = weaponmod.id ' +
                'LEFT JOIN weaponmod_is_corporation ON weaponmod_is_corporation.weaponmod_id = weaponmod.id ' +
                'WHERE weapon_has_weaponmod.weapon_id = ? AND weaponmod.deleted IS NULL';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
