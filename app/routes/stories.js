'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');

module.exports = (router) => {
    const tableName = 'story';

    let query = 'SELECT * FROM ' + tableName;

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'asset');
    relations.route(router, tableName, 'augmentation');
    relations.route(router, tableName, 'bionic');
    relations.route(router, tableName, 'creature');
    relations.route(router, tableName, 'location');
    relations.route(router, tableName, 'armour');
    relations.route(router, tableName, 'shield');
    relations.route(router, tableName, 'software');
    relations.route(router, tableName, 'weapon');
    relations.route(router, tableName, 'weaponmod');
};

