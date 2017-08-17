var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'background',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM background';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'background.canon = 1 AND ' +
                'background.species_id IS NULL AND ' +
                'background.manifestation_id IS NULL AND ' +
                'background.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'background.canon = 1 AND ' +
                'background.species_id = ? AND ' +
                'background.manifestation_id IS NULL AND ' +
                'background.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // Manifestation

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'background.canon = 1 AND ' +
                'background.species_id IS NULL AND ' +
                'background.manifestation_id = ? AND ' +
                'background.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // ID

    router.route('/:backgroundId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE background.id = ? AND background.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.backgroundId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.backgroundId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.backgroundId, adminRestriction);
        });

    router.route('/:backgroundId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.backgroundId, useUpdateColumn);
        });

    router.route('/:backgroundId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.backgroundId, adminRestriction, userContent);
        });

    router.route('/:backgroundId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.backgroundId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.backgroundId);
        });

    router.route('/:backgroundId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.backgroundId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });

    // Asset List

    router.route('/:backgroundId/assets')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM background_has_asset ' +
                'LEFT JOIN asset ON asset.id = background_has_asset.asset_id ' +
                'WHERE ' +
                'background_has_asset.background_id = ?';

            sequel.get(req, res, next, call, [req.params.backgroundId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.backgroundId, 'asset', req.body.insert_id, req.body.value);
        });

    router.route('/:backgroundId/assets/:assetId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.backgroundId, 'asset', req.params.assetId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.backgroundId, 'asset', req.params.assetId);
        });

    // Attribute List

    router.route('/:backgroundId/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM background_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = background_has_attribute.attribute_id ' +
                'WHERE ' +
                'background_has_attribute.background_id = ?';

            sequel.get(req, res, next, call, [req.params.backgroundId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.backgroundId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:backgroundId/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.backgroundId, 'attribute', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.backgroundId, 'attribute', req.params.attributeId);
        });

    // Skill List

    router.route('/:backgroundId/skills')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM background_has_skill ' +
                'LEFT JOIN skill ON skill.id = background_has_skill.skill_id ' +
                'WHERE ' +
                'background_has_skill.background_id = ?';

            sequel.get(req, res, next, call, [req.params.backgroundId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.backgroundId, 'skill', req.body.insert_id, req.body.value);
        });

    router.route('/:backgroundId/skills/:skillId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.backgroundId, 'skill', req.params.skillId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.backgroundId, 'skill', req.params.skillId);
        });
};
