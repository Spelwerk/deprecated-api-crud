'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');

module.exports = (router) => {
    const tableName = 'epoch';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'armour');
    relations.route(router, tableName, 'asset');
    relations.route(router, tableName, 'background');
    relations.route(router, tableName, 'bionic');
    relations.route(router, tableName, 'corporation');
    relations.route(router, tableName, 'expertise');
    relations.route(router, tableName, 'gift');
    relations.route(router, tableName, 'identity');
    relations.route(router, tableName, 'imperfection');
    relations.route(router, tableName, 'manifestation');
    relations.route(router, tableName, 'milestone');
    relations.route(router, tableName, 'shield');
    relations.route(router, tableName, 'skill');
    relations.route(router, tableName, 'software');
    relations.route(router, tableName, 'wealth');
    relations.route(router, tableName, 'weapon');
};
