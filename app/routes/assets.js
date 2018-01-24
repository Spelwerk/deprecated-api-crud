'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const basic = require('../../lib/generic/basics');

module.exports = (router) => {
    const tableName = 'asset';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/type/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'assettype_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // RELATIONS

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'primal');
    relations.route(router, tableName, 'skill');
};
