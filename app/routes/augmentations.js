var basic = require('./../../lib/generic/basic'),
    relations = require('./../../lib/generic/relations');

module.exports = function(router) {
    'use strict';

    var tableName = 'augmentation';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    basic.root(router, sql, tableName);

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.clone(router, tableName);
    basic.comments(router);
    basic.ownership(router);

    // Relations

    relations(router, 'attributes', 'attribute', true);
    relations(router, 'expertises', 'expertise', true);
    relations(router, 'skills', 'skill', true);
    relations(router, 'software', 'software');
};
