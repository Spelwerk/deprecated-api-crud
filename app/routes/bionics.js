var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'bionic',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM bionic';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'bionic.canon = 1 AND ' +
                'bionic.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Body Parts

    router.route('/bodypart/:bodyPartId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'bionic.canon = 1 AND ' +
                'bionic.bodypart_id = ? AND ' +
                'bionic.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.bodyPartId]);
        });

    // ID

    router.route('/:bionicId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE bionic.id = ? AND bionic.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.bionicId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.bionicId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.bionicId, adminRestriction);
        });

    router.route('/:bionicId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.bionicId, useUpdateColumn);
        });

    router.route('/:bionicId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.bionicId, adminRestriction, userContent);
        });

    router.route('/:bionicId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.bionicId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.bionicId);
        });

    router.route('/:bionicId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.bionicId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });

    // Attribute List

    router.route('/:bionicId/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM bionic_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = bionic_has_attribute.attribute_id ' +
                'WHERE ' +
                'bionic_has_attribute.bionic_id = ?';

            sequel.get(req, res, next, call, [req.params.bionicId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.bionicId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:bionicId/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.bionicId, 'attribute', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.bionicId, 'attribute', req.params.attributeId);
        });

    // Augmentation List

    router.route('/:bionicId/augmentations')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM bionic_has_augmentation ' +
                'LEFT JOIN augmentation ON augmentation.id = bionic_has_augmentation.augmentation_id ' +
                'WHERE ' +
                'bionic_has_augmentation.bionic_id = ?';

            sequel.get(req, res, next, call, [req.params.bionicId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.bionicId, 'augmentation', req.body.insert_id);
        });

    router.route('/:bionicId/augmentations/:augmentationId')
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.bionicId, 'augmentation', req.params.augmentationId);
        });
};
