var sequel = require('./../../lib/sql/sequel');

var basic = require('../../lib/generic/basic');

module.exports = function(router) {
    'use strict';

    var tableName = 'meeting';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    basic.root(router, sql, tableName);

    router.route('/story/:storyId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'story_id = ?';

            sequel.get(req, res, next, call, [req.params.storyId]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.comments(router);
    basic.ownership(router);
    basic.revive(router);
};
