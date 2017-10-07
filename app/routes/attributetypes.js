'use strict';

var generic = require('../../lib/helper/generic');

module.exports = function(router) {
    var tableName = 'attributetype',
        options = {
            adminRestriction: true,
            updatedField: true
        };

    var sql = 'SELECT * FROM ' + tableName;

    generic.root(router, tableName, sql);
    generic.post(router, tableName, options);
    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.revive(router, tableName);
};
