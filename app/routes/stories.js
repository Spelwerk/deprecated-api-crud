'use strict';

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

module.exports = function(router) {
    var tableName = 'story';

    var sql = 'SELECT * FROM ' + tableName;

    generic.root(router, tableName, sql);
    generic.post(router, tableName, false, true);
    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);
    generic.put(router, tableName, false, true);
    generic.delete(router, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);

    // Relations

    relations(router, tableName, 'locations', 'location');

    // Creatures

    //todo special for creatures (player col)
};

//todo story_has_asset || story_has_protection || story_has_weapon || story_has_weaponmod || story_has_bionic || story_has_augmentation || story_has_software
