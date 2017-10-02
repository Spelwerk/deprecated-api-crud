'use strict';

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

module.exports = function(router) {
    var tableName = 'story';

    var sql = 'SELECT * FROM ' + tableName;

    generic.root(router, sql, tableName, false, true);

    // ID

    generic.id(router, sql, tableName, false, true);
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
