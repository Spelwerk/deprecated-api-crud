'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    const tableName = 'identity';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'identity.id, ' +
        'identity.canon, ' +
        'identity.name, ' +
        'identity.description, ' +
        'identity.icon, ' +
        'identity.created, ' +
        'identity.updated, ' +
        'identity_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM identity ' +
        'LEFT JOIN identity_is_copy ON identity_is_copy.identity_id = identity.id ' +
        'LEFT JOIN user ON user.id = identity.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
