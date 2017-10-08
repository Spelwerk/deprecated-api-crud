'use strict';

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    var tableName = 'asset',
        options = { updatedField: true };

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName, options);
    generic.deleted(router, tableName, sql);

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'assettype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.images(router, tableName);
    generic.labels(router, tableName);
    generic.permissions(router, tableName);
    generic.revive(router, tableName);

    // RELATIONS

    relations(router, tableName, 'attributes', 'attribute');
    relations(router, tableName, 'doctrines', 'doctrine');
    relations(router, tableName, 'skills', 'skill');
};
