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

    relations.route(router, tableName, 'assets', 'asset');
    relations.route(router, tableName, 'augmentations', 'augmentation');
    relations.route(router, tableName, 'bionics', 'bionic');
    relations.route(router, tableName, 'creatures', 'creature');
    relations.route(router, tableName, 'locations', 'location');
    relations.route(router, tableName, 'armours', 'armour');
    relations.route(router, tableName, 'shields', 'shield');
    relations.route(router, tableName, 'software', 'software');
    relations.route(router, tableName, 'weapons', 'weapon');
    relations.route(router, tableName, 'weaponmods', 'weaponmod');
};

