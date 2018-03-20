'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    const tableName = 'tactic';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'tactic.id, ' +
        'tactic.canon, ' +
        'tactic.name, ' +
        'tactic.description, ' +
        'tactic.effects, ' +
        'tactic.icon, ' +
        'tactic.cost, ' +
        'tactic.created, ' +
        'tactic.updated, ' +
        'weapontype.id AS type_id, ' +
        'weapontype.name AS type_name, ' +
        'expertise.id AS expertise_id, ' +
        'expertise.name AS expertise_name, ' +
        'attribute.id AS damage_id, ' +
        'attribute.name AS damage_name, ' +
        'tactic.damage_dice, ' +
        'tactic.damage_bonus, ' +
        'tactic.critical_dice, ' +
        'tactic.critical_bonus, ' +
        'tactic_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM tactic ' +
        'LEFT JOIN tactic_is_copy ON tactic_is_copy.tactic_id = tactic.id ' +
        'LEFT JOIN weapontype ON weapontype.id = tactic.weapontype_id ' +
        'LEFT JOIN expertise ON expertise.id = weapontype.expertise_id ' +
        'LEFT JOIN attribute ON attribute.id = weapontype.attribute_id ' +
        'LEFT JOIN user ON user.id = tactic.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
