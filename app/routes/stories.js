'use strict';

let generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

module.exports = function(router) {
    const tableName = 'story';

    let sql = 'SELECT * FROM ' + tableName;

    generic.root(router, tableName, sql);
    generic.post(router, tableName);
    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);
    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);

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

