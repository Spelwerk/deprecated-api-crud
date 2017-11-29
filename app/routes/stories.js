'use strict';

let generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

module.exports = function(router) {
    let tableName = 'story',
        options = {};

    let sql = 'SELECT * FROM ' + tableName;

    generic.root(router, tableName, sql);
    generic.post(router, tableName, options);
    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.permissions(router, tableName);
    generic.revive(router, tableName);

    // Relations

    relations(router, tableName, 'assets', 'asset');
    relations(router, tableName, 'augmentations', 'augmentation');
    relations(router, tableName, 'bionics', 'bionic');
    relations(router, tableName, 'creatures', 'creature');
    relations(router, tableName, 'locations', 'location');
    relations(router, tableName, 'protections', 'protection');
    relations(router, tableName, 'software', 'software');
    relations(router, tableName, 'weapons', 'weapon');
    relations(router, tableName, 'weaponmods', 'weaponmod');
};

