'use strict';

var generic = require('../../lib/helper/generic');

module.exports = function(router) {
    var tableName = 'softwaretype';

    var sql = 'SELECT * FROM ' + tableName;

    generic.root(router, tableName, sql);
    generic.post(router, tableName, true);
    generic.deleted(router, tableName, sql);

    generic.get(router, tableName, sql);
    generic.put(router, tableName, true);
    generic.delete(router, tableName, true);
    generic.canon(router, tableName);
    generic.revive(router, tableName);
};
