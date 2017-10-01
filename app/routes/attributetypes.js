'use strict';

var generic = require('../../lib/helper/generic');

module.exports = function(router) {
    var tableName = 'attributetype';

    var sql = 'SELECT * FROM ' + tableName;

    generic.root(router, sql, tableName, true);
    generic.id(router, sql, tableName, true);
    generic.canon(router, tableName);
    generic.revive(router, tableName);
};
