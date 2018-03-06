'use strict';

const routes = require('../../lib/generic/routes');

module.exports = (router) => {
    const tableName = 'nature';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'nature.id, ' +
        'nature.canon, ' +
        'nature.name, ' +
        'nature.description, ' +
        'nature.icon, ' +
        'nature.created, ' +
        'nature.updated, ' +
        'nature_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM nature ' +
        'LEFT JOIN nature_is_copy ON nature_is_copy.nature_id = nature.id ' +
        'LEFT JOIN user ON user.id = nature.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
