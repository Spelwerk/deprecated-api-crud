'use strict';

let generic = require('../../lib/helper/generic'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    let tableName = 'attribute';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName);
    generic.deleted(router, tableName, sql);

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND ' +
                'attribute.attributetype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);
};
