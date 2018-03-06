'use strict';

const routes = require('../../lib/generic/routes');

module.exports = (router) => {
    const tableName = 'creaturetype';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'creaturetype.id, ' +
        'creaturetype.canon, ' +
        'creaturetype.name, ' +
        'creaturetype.description, ' +
        'creaturetype.created, ' +
        'creaturetype.updated, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM creaturetype ' +
        'LEFT JOIN user ON user.id = creaturetype.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
