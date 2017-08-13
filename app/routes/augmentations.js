var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'augmentation',
        userContent = true,
        adminRestriction = false;

    var sql = 'SELECT * FROM augmentation';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'augmentation.canon = 1 AND ' +
                'augmentation.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Augmentation ID

    router.route('/:augmentationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE augmentation.id = ? AND augmentation.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.augmentationId]);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.augmentationId, adminRestriction);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.augmentationId, adminRestriction);
        });

    router.route('/:augmentationId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.augmentationId);
        });

    router.route('/:augmentationId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.augmentationId, adminRestriction, userContent);
        });

    router.route('/:augmentationId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.augmentationId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.augmentationId);
        });

    router.route('/:augmentationId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.augmentationId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });

    // Attribute List

    router.route('/:augmentationId/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM augmentation_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = augmentation_has_attribute.attribute_id ' +
                'WHERE ' +
                'augmentation_has_attribute.augmentation_id = ?';

            sequel.get(req, res, next, call, [req.params.augmentationId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.augmentationId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:augmentationId/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.augmentationId, 'attribute', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.augmentationId, 'attribute', req.params.attributeId);
        });

    // Skill List

    router.route('/:augmentationId/skills')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM augmentation_has_skill ' +
                'LEFT JOIN skill ON skill.id = augmentation_has_skill.skill_id ' +
                'WHERE ' +
                'augmentation_has_skill.augmentation_id = ?';

            sequel.get(req, res, next, call, [req.params.augmentationId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.augmentationId, 'skill', req.body.insert_id, req.body.value);
        });

    router.route('/:augmentationId/skills/:skillId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.augmentationId, 'skill', req.params.skillId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.augmentationId, 'skill', req.params.skillId);
        });
};
