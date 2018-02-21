'use strict';

const routes = require('../../lib/generic/routes');

module.exports = (router) => {
    const tableName = 'attributetype';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'attributetype.id, ' +
        'attributetype.canon, ' +
        'attributetype.name, ' +
        'attributetype.created, ' +
        'attributetype.updated, ' +
        'attributetype.user_id, ' +
        'user.displayname AS user_displayname ' +
        'FROM attributetype ' +
        'LEFT JOIN user ON user.id = attributetype.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
