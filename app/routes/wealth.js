'use strict';

let generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

module.exports = function(router) {
    const tableName = 'wealth';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName);
    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);
    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
};
