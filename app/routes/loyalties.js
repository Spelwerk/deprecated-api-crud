'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    const tableName = 'loyalty';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'loyalty.id, ' +
        'loyalty.canon, ' +
        'loyalty.name, ' +
        'loyalty.description, ' +
        'loyalty.icon, ' +
        'loyalty.value, ' +
        'loyalty.created, ' +
        'loyalty.updated, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM loyalty ' +
        'LEFT JOIN user ON user.id = loyalty.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
