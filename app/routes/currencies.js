'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    const tableName = 'currency';

    const rootQuery = 'SELECT id, canon, name, short, exchange, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'currency.id, ' +
        'currency.canon, ' +
        'currency.name, ' +
        'currency.description, ' +
        'currency.short, ' +
        'currency.exchange, ' +
        'currency.created, ' +
        'currency.updated, ' +
        'currency_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM currency ' +
        'LEFT JOIN currency_is_copy ON currency_is_copy.currency_id = currency.id ' +
        'LEFT JOIN user ON user.id = currency.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
