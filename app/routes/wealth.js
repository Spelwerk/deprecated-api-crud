'use strict';

const routes = require('../../lib/routes/generic/routes');
const relations = require('../../lib/routes/generic/relations/routes');

module.exports = function(router) {
    const tableName = 'wealth';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'wealth.id, ' +
        'wealth.canon, ' +
        'wealth.name, ' +
        'wealth.description, ' +
        'wealth.icon, ' +
        'wealth.created, ' +
        'wealth.updated, ' +
        'wealth_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM wealth ' +
        'LEFT JOIN wealth_is_copy ON wealth_is_copy.wealth_id = wealth.id ' +
        'LEFT JOIN user ON user.id = wealth.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
};
