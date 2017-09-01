var sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic');

module.exports = function(router) {
    'use strict';

    var tableName = 'assettype';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    basic.root(router, sql, tableName);

    // Group

    router.route('/group/:groupId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'assetgroup_id = ?';

            sequel.get(req, res, next, call, [req.params.groupId]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.comments(router);
    basic.ownership(router);
};
