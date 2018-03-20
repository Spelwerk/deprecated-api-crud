'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    const tableName = 'country';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'country.id, ' +
        'country.canon, ' +
        'country.name, ' +
        'country.description, ' +
        'country.created, ' +
        'country.updated, ' +
        'currency.id AS currency_id, ' +
        'currency.name AS currency_name, ' +
        'language.id AS language_id, ' +
        'language.name AS language_name, ' +
        'country_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM country ' +
        'LEFT JOIN country_is_currency ON country_is_currency.country_id = country.id ' +
        'LEFT JOIN country_is_language ON country_is_language.country_id = country.id ' +
        'LEFT JOIN country_is_copy ON country_is_copy.country_id = country.id ' +
        'LEFT JOIN currency ON currency.id = country_is_currency.currency_id ' +
        'LEFT JOIN language ON language.id = country_is_language.language_id ' +
        'LEFT JOIN user ON user.id = country.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
