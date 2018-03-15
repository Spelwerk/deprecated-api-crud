'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/relations/generic');
const basic = require('../../lib/generic/basics');

module.exports = (router) => {
    const tableName = 'armour';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'armour.id, ' +
        'armour.canon, ' +
        'armour.name, ' +
        'armour.description, ' +
        'armour.icon, ' +
        'armour.price, ' +
        'armour.created, ' +
        'armour.updated, ' +
        'bodypart.id AS bodypart_id, ' +
        'bodypart.name AS bodypart_name, ' +
        'corporation.id AS corporation_id, ' +
        'corporation.name AS corporation_name, ' +
        'armour_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM armour ' +
        'LEFT JOIN armour_is_corporation ON armour_is_corporation.armour_id = armour.id ' +
        'LEFT JOIN armour_is_copy ON armour_is_copy.armour_id = armour.id ' +
        'LEFT JOIN bodypart ON bodypart.id = armour.bodypart_id ' +
        'LEFT JOIN corporation ON corporation.id = armour_is_corporation.corporation_id ' +
        'LEFT JOIN user ON user.id = armour.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/bodypart/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'bodypart_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'primal');
    relations.route(router, tableName, 'skill');
};
