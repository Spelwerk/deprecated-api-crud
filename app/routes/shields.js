'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');

module.exports = (router) => {
    const tableName = 'shield';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'primal');
    relations.route(router, tableName, 'skill');
};
