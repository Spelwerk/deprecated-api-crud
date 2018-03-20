'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    const tableName = 'language';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'language.id, ' +
        'language.canon, ' +
        'language.name, ' +
        'language.description, ' +
        'language.created, ' +
        'language.updated, ' +
        'language_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM language ' +
        'LEFT JOIN language_is_copy ON language_is_copy.language_id = language.id ' +
        'LEFT JOIN user ON user.id = language.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
