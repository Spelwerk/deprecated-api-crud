'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    const tableName = 'location';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'location.id, ' +
        'location.canon, ' +
        'location.name, ' +
        'location.description, ' +
        'location.price, ' +
        'location.created, ' +
        'location.updated, ' +
        'country.id AS country_id, ' +
        'country.name AS country_name, ' +
        'creature.id AS creature_id, ' +
        'creature.firstname AS creature_firstname, ' +
        'creature.nickname AS creature_nickname, ' +
        'creature.lastname AS creature_lastname, ' +
        'location_is_recursive.recursive_id, ' +
        'location_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM location ' +
        'LEFT JOIN location_is_country ON location_is_country.location_id = location.id ' +
        'LEFT JOIN location_is_creature ON location_is_creature.location_id = location.id ' +
        'LEFT JOIN location_is_recursive ON location_is_recursive.location_id = location.id ' +
        'LEFT JOIN location_is_copy ON location_is_copy.location_id = location.id ' +
        'LEFT JOIN country ON country.id = location_is_country.country_id ' +
        'LEFT JOIN creature ON creature.id = location_is_creature.creature_id ' +
        'LEFT JOIN user ON user.id = location.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
