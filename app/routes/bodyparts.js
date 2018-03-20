'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    const tableName = 'bodypart';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'bodypart.id, ' +
        'bodypart.canon, ' +
        'bodypart.name, ' +
        'bodypart.description, ' +
        'bodypart.weapon, ' +
        'bodypart.created, ' +
        'bodypart.updated, ' +
        'bodypart_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM bodypart ' +
        'LEFT JOIN bodypart_is_copy ON bodypart_is_copy.bodypart_id = bodypart.id ' +
        'LEFT JOIN user ON user.id = bodypart.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
