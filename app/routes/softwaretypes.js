'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    const tableName = 'softwaretype';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'softwaretype.id, ' +
        'softwaretype.canon, ' +
        'softwaretype.name, ' +
        'softwaretype.description, ' +
        'softwaretype.created, ' +
        'softwaretype.updated, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM softwaretype ' +
        'LEFT JOIN user ON user.id = softwaretype.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
