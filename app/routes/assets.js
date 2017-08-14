var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'asset',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT ' +
        'asset.id, ' +
        'asset.canon, ' +
        'asset.popularity, ' +
        'asset.name, ' +
        'asset.description, ' +
        'asset.price, ' +
        'asset.legal, ' +
        'asset.assettype_id, ' +
        'assettype.icon, ' +
        'assettype.assetgroup_id, ' +
        'assetgroup.equippable, ' +
        'asset.created, ' +
        'asset.updated, ' +
        'asset.deleted ' +
        'FROM asset ' +
        'LEFT JOIN assettype ON assettype.id = asset.assettype_id ' +
        'LEFT JOIN assetgroup ON assetgroup.id = assettype.assetgroup_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'asset.canon = 1 AND ' +
                'asset.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Types

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'asset.canon = 1 AND ' +
                'asset.assettype_id = ? AND ' +
                'asset.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    // ID

    router.route('/:assetId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE asset.id = ? AND asset.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.assetId]);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.assetId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.assetId, adminRestriction);
        });

    router.route('/:assetId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.assetId, useUpdateColumn);
        });

    router.route('/:assetId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.assetId, adminRestriction, userContent);
        });

    router.route('/:assetId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.assetId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.assetId);
        });

    router.route('/:assetId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.assetId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });

    // Attribute List

    router.route('/:assetId/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM asset_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = asset_has_attribute.attribute_id ' +
                'WHERE ' +
                'asset_has_attribute.asset_id = ?';

            sequel.get(req, res, next, call, [req.params.assetId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.assetId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:assetId/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.assetId, 'attribute', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.assetId, 'attribute', req.params.attributeId);
        });

    // Doctrine List

    router.route('/:assetId/doctrines')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM asset_has_doctrine ' +
                'LEFT JOIN doctrine ON doctrine.id = asset_has_doctrine.doctrine_id ' +
                'WHERE ' +
                'asset_has_doctrine.asset_id = ?';

            sequel.get(req, res, next, call, [req.params.assetId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.assetId, 'doctrine', req.body.insert_id, req.body.value);
        });

    router.route('/:assetId/doctrines/:doctrineId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.assetId, 'doctrine', req.params.doctrineId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.assetId, 'doctrine', req.params.doctrineId);
        });

    // Expertise List

    router.route('/:assetId/expertises')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM asset_has_expertise ' +
                'LEFT JOIN expertise ON expertise.id = asset_has_expertise.expertise_id ' +
                'WHERE ' +
                'asset_has_expertise.asset_id = ?';

            sequel.get(req, res, next, call, [req.params.assetId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.assetId, 'expertise', req.body.insert_id, req.body.value);
        });

    router.route('/:assetId/expertises/:expertiseId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.assetId, 'expertise', req.params.expertiseId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.assetId, 'expertise', req.params.expertiseId);
        });

    // Skill List

    router.route('/:assetId/skills')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM asset_has_skill ' +
                'LEFT JOIN skill ON skill.id = asset_has_skill.skill_id ' +
                'WHERE ' +
                'asset_has_skill.asset_id = ?';

            sequel.get(req, res, next, call, [req.params.assetId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.assetId, 'skill', req.body.insert_id, req.body.value);
        });

    router.route('/:assetId/skills/:skillId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.assetId, 'skill', req.params.skillId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.assetId, 'skill', req.params.skillId);
        });
};
