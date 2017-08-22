var async = require('async');

var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    query = require('./../../lib/sql/query'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'milestone',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM milestone';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'milestone.canon = 1 AND ' +
                'milestone.background_id IS NULL AND ' +
                'milestone.manifestation_id IS NULL AND ' +
                'milestone.species_id IS NULL AND ' +
                'milestone.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Backgrounds

    router.route('/background/:backgroundId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'milestone.canon = 1 AND ' +
                'milestone.background_id = ? AND ' +
                'milestone.manifestation_id IS NULL AND ' +
                'milestone.species_id IS NULL AND ' +
                'milestone.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.backgroundId]);
        });

    // Manifestations

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'milestone.canon = 1 AND ' +
                'milestone.background_id IS NULL AND ' +
                'milestone.manifestation_id = ? AND ' +
                'milestone.species_id IS NULL AND ' +
                'milestone.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'milestone.canon = 1 AND ' +
                'milestone.background_id IS NULL AND ' +
                'milestone.manifestation_id IS NULL AND ' +
                'milestone.species_id = ? AND ' +
                'milestone.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // ID

    router.route('/:milestoneId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE milestone.id = ? AND milestone.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.milestoneId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.milestoneId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.milestoneId, adminRestriction);
        });

    router.route('/:milestoneId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.milestoneId, useUpdateColumn);
        });

    router.route('/:milestoneId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.milestoneId, adminRestriction, userContent);
        });

    router.route('/:milestoneId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.milestoneId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.milestoneId);
        });

    router.route('/:milestoneId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.milestoneId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });

    // Asset List

    router.route('/:milestoneId/assets')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM milestone_has_asset ' +
                'LEFT JOIN asset ON asset.id = milestone_has_asset.asset_id ' +
                'WHERE ' +
                'milestone_has_asset.milestone_id = ?';

            sequel.get(req, res, next, call, [req.params.milestoneId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.milestoneId, 'asset', req.body.insert_id, req.body.value);
        });

    router.route('/:milestoneId/assets/:assetId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.milestoneId, 'asset', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.milestoneId, 'asset', req.params.assetId);
        });

    // Attribute List

    router.route('/:milestoneId/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM milestone_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = milestone_has_attribute.attribute_id ' +
                'WHERE ' +
                'milestone_has_attribute.milestone_id = ?';

            sequel.get(req, res, next, call, [req.params.milestoneId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.milestoneId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:milestoneId/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.milestoneId, 'attribute', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.milestoneId, 'attribute', req.params.attributeId);
        });

    // Loyalty List

    router.route('/:milestoneId/loyalties')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM milestone_has_loyalty ' +
                'LEFT JOIN loyalty ON loyalty.id = milestone_has_loyalty.loyalty_id ' +
                'WHERE ' +
                'milestone_has_loyalty.milestone_id = ?';

            sequel.get(req, res, next, call, [req.params.milestoneId]);
        })
        .post(function(req, res, next) {
            var milestoneId = parseInt(req.params.milestoneId),
                loyaltyId = parseInt(req.body.insert_id),
                occupation = req.body.occupation,
                influenceMin = parseInt(req.body.influence_min),
                influenceMax = parseInt(req.body.influence_max);

            async.series([
                function(callback) {
                    ownership(req, tableName, milestoneId, adminRestriction, callback);
                },
                function(callback) {
                    query('INSERT INTO milestone_has_loyalty (milestone_id,loyalty_id,occupation,influence_min,influence_max) VALUES (?,?,?,?,?)', [milestoneId,loyaltyId,occupation,influenceMin,influenceMax], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:milestoneId/loyalties/:loyaltyId')
        .put(function(req, res, next) {
            var milestoneId = parseInt(req.params.milestoneId),
                loyaltyId = parseInt(req.params.loyaltyId),
                occupation = req.body.occupation,
                influenceMin = parseInt(req.body.influence_min),
                influenceMax = parseInt(req.body.influence_max);

            async.series([
                function(callback) {
                    ownership(req, tableName, milestoneId, adminRestriction, callback);
                },
                function(callback) {
                    query('UPDATE milestone_has_loyalty SET occupation = ?, influence_min = ?, influence_max = ? WHERE milestone_id = ? AND loyalty_id = ?', [occupation,influenceMin,influenceMax,milestoneId,loyaltyId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.milestoneId, 'loyalty', req.params.loyaltyId);
        });

    // Skill List

    router.route('/:milestoneId/skills')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM milestone_has_skill ' +
                'LEFT JOIN skill ON skill.id = milestone_has_skill.skill_id ' +
                'WHERE ' +
                'milestone_has_skill.milestone_id = ?';

            sequel.get(req, res, next, call, [req.params.milestoneId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.milestoneId, 'skill', req.body.insert_id, req.body.value);
        });

    router.route('/:milestoneId/skills/:skillId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.milestoneId, 'skill', req.params.skillId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.milestoneId, 'skill', req.params.skillId);
        });
};
