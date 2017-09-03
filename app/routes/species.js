var sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic'),
    relations = require('./../../lib/generic/relations');

module.exports = function(router) {
    'use strict';

    var tableName = 'species';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    basic.root(router, sql, tableName);

    // Playable

    router.route('/playable/:playable')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'playable = ?';

            sequel.get(req, res, next, call, [req.params.playable]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.clone(router, tableName);
    basic.comments(router);
    basic.images(router);
    basic.labels(router);
    basic.ownership(router);
    basic.revive(router);

    // Relations

    relations(router, 'bodyparts', 'bodypart');
    relations(router, 'attributes', 'attribute', true);
};
