var sequel = require('./../../lib/sql/sequel');

var basic = require('../../lib/generic/basic'),
    relations = require('../../lib/generic/relations');

module.exports = function(router) {
    'use strict';

    var tableName = 'story';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    basic.root(router, sql, tableName);

    router.route('/world/:worldId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'world_id = ?';

            sequel.get(req, res, next, call, [req.params.worldId]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.clone(router, tableName);
    basic.comments(router);
    basic.labels(router);
    basic.ownership(router);
    basic.revive(router);

    // Relations

    //relations(router, 'locations', 'location');
    //relations(router, 'creatures', 'creature');
    //relations(router, 'individuals', 'individual');
    //relations(router, 'avatars', 'avatar');
};
