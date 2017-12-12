'use strict';

let generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations'),
    sequel = require('../../lib/helper/sequel');

module.exports = function(router) {
    const tableName = 'asset';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName);
    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND ' +
                'assettype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);

    // RELATIONS

    relations.route(router, tableName, 'attributes', 'attribute');
    relations.route(router, tableName, 'primals', 'primal');
    relations.route(router, tableName, 'skills', 'skill');
};
