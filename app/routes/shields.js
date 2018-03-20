'use strict';

const routes = require('../../lib/routes/generic/routes');
const relations = require('../../lib/routes/generic/relations/routes');

module.exports = (router) => {
    const tableName = 'shield';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'shield.id, ' +
        'shield.canon, ' +
        'shield.name, ' +
        'shield.description, ' +
        'shield.icon, ' +
        'shield.price, ' +
        'shield.created, ' +
        'shield.updated, ' +
        'attribute.id AS damage_id, ' +
        'attribute.name AS damage_name, ' +
        'shield.damage_dice, ' +
        'shield.damage_bonus, ' +
        'shield.critical_dice, ' +
        'shield.critical_bonus, ' +
        'expertise.id AS expertise_id, ' +
        'expertise.name AS expertise_name, ' +
        'corporation.id AS corporation_id, ' +
        'corporation.name AS corporation_name, ' +
        'shield_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM shield ' +
        'LEFT JOIN shield_is_corporation ON shield_is_corporation.shield_id = shield.id ' +
        'LEFT JOIN shield_is_copy ON shield_is_copy.shield_id = shield.id ' +
        'LEFT JOIN attribute ON attribute.id = shield.attribute_id ' +
        'LEFT JOIN expertise ON expertise.id = shield.expertise_id ' +
        'LEFT JOIN corporation ON corporation.id = shield_is_corporation.corporation_id ' +
        'LEFT JOIN user ON user.id = shield.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'primal');
    relations.route(router, tableName, 'skill');
};
