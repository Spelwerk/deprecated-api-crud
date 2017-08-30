var comment = require('../../lib/sql/comment'),
    ownership = require('../../lib/sql/ownership'),
    relation = require('../../lib/sql/relation'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'gift',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM gift';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'gift.canon = 1 AND ' +
                'gift.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Manifestations

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'gift.canon = 1 AND ' +
                'gift.manifestation_id = ? AND ' +
                'gift.species_id IS NULL AND ' +
                'gift.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'gift.canon = 1 AND ' +
                'gift.manifestation_id IS NULL AND ' +
                'gift.species_id = ? AND ' +
                'gift.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // ID

    router.route('/:giftId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE gift.id = ? AND gift.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.giftId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.giftId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.giftId, adminRestriction);
        });

    router.route('/:giftId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.giftId, useUpdateColumn);
        });

    router.route('/:giftId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.giftId, adminRestriction, userContent);
        });

    router.route('/:giftId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.giftId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.giftId);
        });

    router.route('/:giftId/ownership')
        .get(function(req, res) {
            ownership(req, req.params.id, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });

    // Attributes

    router.route('/:giftId/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM gift_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = gift_has_attribute.attribute_id ' +
                'WHERE ' +
                'gift_has_attribute.gift_id = ?';

            sequel.get(req, res, next, call, [req.params.giftId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.giftId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:giftId/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.giftId, 'attribute', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.giftId, 'attribute', req.params.attributeId);
        });

    // Skills

    router.route('/:giftId/skills')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM gift_has_skill ' +
                'LEFT JOIN skill ON skill.id = gift_has_skill.skill_id ' +
                'WHERE ' +
                'gift_has_skill.gift_id = ?';

            sequel.get(req, res, next, call, [req.params.giftId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.giftId, 'skill', req.body.insert_id, req.body.value);
        });

    router.route('/:giftId/skills/:skillId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.giftId, 'skill', req.params.skillId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.giftId, 'skill', req.params.skillId);
        });
};
