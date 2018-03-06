'use strict';

const routes = require('../../lib/generic/routes');

module.exports = (router) => {
    const tableName = 'corporation';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'corporation.id, ' +
        'corporation.canon, ' +
        'corporation.name, ' +
        'corporation.description, ' +
        'corporation.created, ' +
        'corporation.updated, ' +
        'corporation_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM corporation ' +
        'LEFT JOIN corporation_is_copy ON corporation_is_copy.corporation_id = corporation.id ' +
        'LEFT JOIN user ON user.id = corporation.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
