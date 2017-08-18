var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'imperfection',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM imperfection';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'imperfection.canon = 1 AND ' +
                'imperfection.manifestation_id IS NULL AND ' +
                'imperfection.species_id IS NULL AND ' +
                'imperfection.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Manifestations

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'imperfection.canon = 1 AND ' +
                'imperfection.manifestation_id = ? AND ' +
                'imperfection.species_id IS NULL AND ' +
                'imperfection.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'imperfection.canon = 1 AND ' +
                'imperfection.manifestation_id IS NULL AND ' +
                'imperfection.species_id = ? AND ' +
                'imperfection.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // ID

    router.route('/:imperfectionId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE imperfection.id = ? AND imperfection.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.imperfectionId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.imperfectionId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.imperfectionId, adminRestriction);
        });

    router.route('/:imperfectionId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.imperfectionId, useUpdateColumn);
        });

    router.route('/:imperfectionId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.imperfectionId, adminRestriction, userContent);
        });

    router.route('/:imperfectionId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.imperfectionId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.imperfectionId);
        });

    router.route('/:imperfectionId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.imperfectionId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });

    // Attributes

    router.route('/:imperfectionId/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM imperfection_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = imperfection_has_attribute.attribute_id ' +
                'WHERE ' +
                'imperfection_has_attribute.imperfection_id = ?';

            sequel.get(req, res, next, call, [req.params.imperfectionId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.imperfectionId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:imperfectionId/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.imperfectionId, 'attribute', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.imperfectionId, 'attribute', req.params.attributeId);
        });

    // Skills

    router.route('/:imperfectionId/skills')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM imperfection_has_skill ' +
                'LEFT JOIN skill ON skill.id = imperfection_has_skill.skill_id ' +
                'WHERE ' +
                'imperfection_has_skill.imperfection_id = ?';

            sequel.get(req, res, next, call, [req.params.imperfectionId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.imperfectionId, 'skill', req.body.insert_id, req.body.value);
        });

    router.route('/:imperfectionId/skills/:skillId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.imperfectionId, 'skill', req.params.skillId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.imperfectionId, 'skill', req.params.skillId);
        });
};
