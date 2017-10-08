'use strict';

var generic = require('../../lib/helper/generic'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    var tableName = 'focus',
        options = {
            ownership: ['manifestation'],
            updatedField: true
        };

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName, options);
    generic.deleted(router, tableName, sql);

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.permissions(router, tableName);
    generic.revive(router, tableName);
};
