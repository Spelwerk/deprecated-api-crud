'use strict';

var generic = require('../../lib/helper/generic');

module.exports = function(router) {
    var tableName = 'loyalty';

    var sql = 'SELECT * FROM ' + tableName;

    generic.root(router, sql, tableName, true);
    generic.id(router, sql, tableName, true);
};
