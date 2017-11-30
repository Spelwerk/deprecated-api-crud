'use strict';

let generic = require('../../lib/helper/generic');

module.exports = function(router) {
    let tableName = 'attributetype';

    let sql = 'SELECT * FROM ' + tableName;

    generic.root(router, tableName, sql);
    generic.post(router, tableName);
    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);
};
