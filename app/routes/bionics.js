var sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic'),
    relations = require('./../../lib/generic/relations');

module.exports = function(router) {
    'use strict';

    var tableName = 'bionic';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    basic.root(router, sql, tableName);

    // Body Parts

    router.route('/bodypart/:bodyPartId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'bodypart_id = ?';

            sequel.get(req, res, next, call, [req.params.bodyPartId]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.clone(router, tableName);
    basic.comments(router);
    basic.ownership(router);

    // Relations

    relations(router, 'attributes', 'attribute', true);
    relations(router, 'augmentations', 'augmentation');
    relations(router, 'software', 'software');
};
