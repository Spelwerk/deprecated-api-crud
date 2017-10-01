'use strict';

var generic = require('../../lib/helper/generic');

var sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    var tableName = 'software';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, sql, tableName, false, true);

    // Type

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'softwaretype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    // ID

    generic.id(router, sql, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.images(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
