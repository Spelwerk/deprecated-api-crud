'use strict';

const routes = require('../../lib/generic/routes');

module.exports = (router) => {
    const tableName = 'focus';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'focus.id, ' +
        'focus.canon, ' +
        'focus.name, ' +
        'focus.description, ' +
        'focus.icon, ' +
        'focus.created, ' +
        'focus.updated, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name As manifestation_name, ' +
        'focus_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM focus ' +
        'LEFT JOIN focus_is_copy ON focus_is_copy.focus_id = focus.id ' +
        'LEFT JOIN manifestation ON manifestation.id = focus.manifestation_id ' +
        'LEFT JOIN user ON user.id = focus.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
