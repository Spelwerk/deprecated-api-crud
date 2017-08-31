var query = require('../../lib/sql/query'),
    ownership = require('../../lib/sql/ownership'),
    sequel = require('../../lib/sql/sequel'),
    generic = require('../../lib/sql/generic'),
    comment = require('../../lib/sql/comment'),
    relation = require('../../lib/sql/relation');

module.exports = function(router) {
    'use strict';

    var tableName = 'weapon';

    var sql = 'SELECT * FROM weapon ' +
        'LEFT JOIN generic ON generic.id = weapon.generic_id ' +
        'LEFT JOIN weapontype ON weapontype.generic_id = weapon.weapontype_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            generic.post(req, res, next, tableName);
        });

    // Augmentation

    router.route('/augmentation/:augmentationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'augmentation_id = ?';

            sequel.get(req, res, next, call, [req.params.augmentationId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // Types

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'weapontype_id = ?';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    // ID

    router.route('/:id')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .put(function(req, res, next) {
            generic.put(req, res, next, tableName, req.params.id);
        })
        .delete(function(req, res, next) {
            generic.delete(req, res, next, req.params.id);
        });

    router.route('/:id/canon')
        .put(function(req, res, next) {
            generic.canon(req, res, next, req.params.id);
        });

    router.route('/:id/clone')
        .post(function(req, res, next) {
            generic.clone(req, res, next, tableName, req.params.id);
        });

    router.route('/:id/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, req.params.id);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, req.params.id);
        });

    router.route('/:id/ownership')
        .get(function(req, res) {
            ownership(req, req.params.id, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });

    // Attributes

    router.route('/:id/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM generic_has_generic ' +
                'LEFT JOIN generic ON generic.id = generic_has_generic.relation_id ' +
                'LEFT JOIN attribute ON attribute.generic_id = generic_has_generic.relation_id ' +
                'WHERE ' +
                'generic_has_generic.generic_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, req.params.id, req.body.insert_id, req.body.value);
        });

    router.route('/:id/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, req.params.id, req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, req.params.id, req.params.attributeId);
        });

    // Expertises

    router.route('/:id/expertises')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM generic_has_generic ' +
                'LEFT JOIN generic ON generic.id = generic_has_generic.relation_id ' +
                'LEFT JOIN expertise ON expertise.generic_id = generic_has_generic.relation_id ' +
                'WHERE ' +
                'generic_has_generic.generic_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, req.params.id, req.body.insert_id, req.body.value);
        });

    router.route('/:id/expertises/:expertiseId')
        .put(function(req, res, next) {
            relation.put(req, res, next, req.params.id, req.params.expertiseId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, req.params.id, req.params.expertiseId);
        });

    // Mods

    router.route('/:id/mods')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM generic_has_generic ' +
                'LEFT JOIN generic ON generic.id = generic_has_generic.relation_id ' +
                'LEFT JOIN weaponmod ON weaponmod.generic_id = generic_has_generic.relation_id ' +
                'WHERE ' +
                'generic_has_generic.generic_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, req.params.id, req.body.insert_id);
        });

    router.route('/:id/mods/:modId')
        .delete(function(req, res, next) {
            relation.delete(req, res, next, req.params.id, req.params.modId);
        });

    // Skills

    router.route('/:id/skills')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM generic_has_generic ' +
                'LEFT JOIN generic ON generic.id = generic_has_generic.relation_id ' +
                'LEFT JOIN skill ON skill.generic_id = generic_has_generic.relation_id ' +
                'WHERE ' +
                'generic_has_generic.generic_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, req.params.id, req.body.insert_id, req.body.value);
        });

    router.route('/:id/skills/:skillId')
        .put(function(req, res, next) {
            relation.put(req, res, next, req.params.id, req.params.skillId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, req.params.id, req.params.skillId);
        });
};
