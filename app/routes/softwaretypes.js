'use strict';

let generic = require('../../lib/helper/generic');

module.exports = function(router) {
    let tableName = 'softwaretype',
        options = {};

    let sql = 'SELECT * FROM ' + tableName;

    generic.root(router, tableName, sql);
    generic.post(router, tableName, options);
    generic.deleted(router, tableName, sql);

    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);

    generic.automatic(router, tableName);
};
