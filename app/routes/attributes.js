'use strict';

var generic = require('../../lib/helper/generic'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    var tableName = 'attribute';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName, false, true);
    generic.deleted(router, tableName, sql);

    // Type

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'attribute.attributetype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    // ID

    generic.get(router, tableName, sql);
    generic.put(router, tableName, false, true);
    generic.delete(router, tableName, false, true);
    generic.canon(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
