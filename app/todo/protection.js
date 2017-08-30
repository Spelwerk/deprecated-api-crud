var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'protection',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM protection';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'protection.canon = 1 AND ' +
                'protection.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Body Parts

    router.route('/bodypart/:bodyPartId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'protection.canon = 1 AND ' +
                'protection.bodypart_id = ? AND ' +
                'protection.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.bodyPartId]);
        });

    // ID

    router.route('/:protectionId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE protection.id = ? AND protection.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.protectionId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.protectionId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.protectionId, adminRestriction);
        });

    router.route('/:protectionId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.protectionId, useUpdateColumn);
        });

    router.route('/:protectionId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.protectionId, adminRestriction, userContent);
        });

    router.route('/:protectionId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.protectionId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.protectionId);
        });

    router.route('/:protectionId/ownership')
        .get(function(req, res) {
            ownership(req, req.params.id, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });

    // Attribute List

    router.route('/:protectionId/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM protection_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = protection_has_attribute.attribute_id ' +
                'WHERE ' +
                'protection_has_attribute.protection_id = ?';

            sequel.get(req, res, next, call, [req.params.protectionId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.protectionId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:protectionId/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.protectionId, 'attribute', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.protectionId, 'attribute', req.params.attributeId);
        });
};
