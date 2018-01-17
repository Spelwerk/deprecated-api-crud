'use strict';

const routes = require('../../lib/generic/routes');

module.exports = (router) => {
    const tableName = 'creaturetype';

    let query = 'SELECT * FROM ' + tableName;

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
