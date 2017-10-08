'use strict';

var generic = require('../../lib/helper/generic'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    var tableName = 'software',
        options = { updatedField: true };

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName, options);
    generic.deleted(router, tableName, sql);

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'softwaretype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.images(router, tableName);
    generic.permissions(router, tableName);
    generic.revive(router, tableName);
};
