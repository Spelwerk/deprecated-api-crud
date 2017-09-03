var sequel = require('../../lib/sql/sequel'),
    generic = require('../../lib/sql/generic');

var basic = require('./../../lib/generic/basic'),
    relations = require('./../../lib/generic/relations');

module.exports = function(router) {
    'use strict';

    var tableName = 'asset';

    var sql = 'SELECT ' +
        'asset.generic_id, ' +
        'asset.assettype_id, ' +
        'asset.legal, ' +
        'asset.price, ' +
        'assettype.assetgroup_id, ' +
        'assettype.equipable, ' +
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
        'FROM asset ' +
        'LEFT JOIN generic ON generic.id = asset.generic_id ' +
        'LEFT JOIN assettype ON assettype.generic_id = asset.assettype_id';

    basic.root(router, sql, tableName);

    // Group

    router.route('/group/:groupId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'assetgroup_id = ?';

            sequel.get(req, res, next, call, [req.params.groupId]);
        });

    // Type

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'assettype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
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

    relations(router, 'attributes', 'attribute', true);
    relations(router, 'doctrines', 'doctrine', true);
    relations(router, 'expertises', 'expertise', true);
    relations(router, 'skills', 'skill', true);
};
