var ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'attribute',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT ' +
        'attribute.id, ' +
        'attribute.canon, ' +
        'attribute.name, ' +
        'attribute.description, ' +
        'attribute.attributetype_id, ' +
        'attributetype.maximum, ' +
        'attributetype.special, ' +
        'attribute.icon, ' +
        'attribute.created, ' +
        'attribute.updated, ' +
        'attribute.deleted ' +
        'FROM attribute ' +
        'LEFT JOIN attributetype ON attributetype.id = attribute.attributetype_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'attribute.canon = 1 AND ' +
                'attributetype.special = 0 AND ' +
                'attribute.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Special

    router.route('/special')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'attribute.canon = 1 AND ' +
                'attributetype.special = 1 AND ' +
                'attribute.deleted IS NULL';

            sequel.get(req, res, next, call);
        });

    // Type

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'attribute.canon = 1 AND ' +
                'attribute.attributetype_id = ? AND ' +
                'attribute.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    // ID

    router.route('/:attributeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE attribute.id = ? AND attribute.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.attributeId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.attributeId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.attributeId, adminRestriction);
        });

    router.route('/:attributeId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.attributeId, useUpdateColumn);
        });

    router.route('/:attributeId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.attributeId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });

};
