'use strict';

const routes = require('../../lib/routes/generic/routes');
const basic = require('../../lib/routes/generic/generic');

module.exports = (router) => {
    const tableName = 'weaponmod';

    const rootQuery = 'SELECT id, canon, name, icon, short, price, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'weaponmod.id, ' +
        'weaponmod.canon, ' +
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
        'weaponmod.distance, ' +
        'weaponmod.created, ' +
        'weaponmod.updated, ' +
        'corporation.id AS corporation_id, ' +
        'corporation.name AS corporation_name, ' +
        'weaponmod_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM weaponmod ' +
        'LEFT JOIN weaponmod_is_corporation ON weaponmod_is_corporation.weaponmod_id = weaponmod.id ' +
        'LEFT JOIN weaponmod_is_copy ON weaponmod_is_copy.weaponmod_id = weaponmod.id ' +
        'LEFT JOIN corporation ON corporation.id = weaponmod_is_corporation.corporation_id ' +
        'LEFT JOIN user ON user.id = weaponmod.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/weapon/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN weapon_has_weaponmod ON weapon_has_weaponmod.weaponmod_id = weaponmod.id ' +
                'WHERE weapon_has_weaponmod.weapon_id = ? AND weaponmod.deleted IS NULL';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
