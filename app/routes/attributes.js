var sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic');

module.exports = function(router) {
    'use strict';

    var tableName = 'attribute';

    var sql = 'SELECT ' +
        'attribute.generic_id, ' +
        'attribute.attributetype_id, ' +
        'attribute.manifestation_id, ' +
        'attribute.maximum, ' +
        'generic.id, ' +
        'generic.user_id, ' +
        'generic.original_id, ' +
        'generic.canon, ' +
        'generic.name, ' +
        'generic.description, ' +
        'generic.icon, ' +
        'generic.created, ' +
        'generic.updated, ' +
        'generic.deleted ' +
        'FROM attribute ' +
        'LEFT JOIN generic ON generic.id = attribute.generic_id ' +
        'LEFT JOIN attributetype ON attributetype.generic_id = attribute.attributetype_id';

    basic.root(router, sql, tableName);

    // Manifestation

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // Type

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'attribute.attributetype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.comments(router);
    basic.labels(router);
    basic.ownership(router);
    basic.revive(router);
};
