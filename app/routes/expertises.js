var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'expertise',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT ' +
        'expertise.id, ' +
        'expertise.canon, ' +
        'expertise.popularity, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'expertise.skill_id, ' +
        'skill.name AS skill_name, ' +
        'expertise.species_id, ' +
        'species.name AS species_name, ' +
        'expertise.manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'skill.icon, ' +
        'expertise.created, ' +
        'expertise.updated, ' +
        'expertise.deleted ' +
        'FROM expertise ' +
        'LEFT JOIN skill ON skill.id = expertise.skill_id ' +
        'LEFT JOIN species ON species.id = expertise.species_id ' +
        'LEFT JOIN manifestation ON manifestation.id = expertise.manifestation_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'expertise.canon = 1 AND ' +
                'expertise.manifestation_id IS NULL AND ' +
                'expertise.species_id IS NULL AND ' +
                'expertise.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Manifestations

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'expertise.manifestation_id = ? AND ' +
                'expertise.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // Skills

    router.route('/skill/:skillId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'expertise.canon = 1 AND ' +
                'expertise.manifestation_id IS NULL AND ' +
                'expertise.skill_id = ? AND ' +
                'expertise.species_id IS NULL AND ' +
                'expertise.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.skillId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'expertise.manifestation_id IS NULL AND ' +
                'expertise.skill_id IS NULL AND ' +
                'expertise.species_id = ? AND ' +
                'expertise.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // Skills & Manifestations

    router.route('/skill/:skillId/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'expertise.manifestation_id = ? AND ' +
                'expertise.skill_id = ? AND ' +
                'expertise.species_id IS NULL AND ' +
                'expertise.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.manifestationId, req.params.skillId]);
        });

    // Skills & Species

    router.route('/skill/:skillId/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'expertise.manifestation_id IS NULL AND ' +
                'expertise.skill_id = ? AND ' +
                'expertise.species_id = ? AND ' +
                'expertise.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.skillId, req.params.speciesId]);
        });

    // ID

    router.route('/:expertiseId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE expertise.id = ? AND expertise.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.expertiseId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.expertiseId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.expertiseId, adminRestriction);
        });

    router.route('/:expertiseId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.expertiseId, useUpdateColumn);
        });

    router.route('/:expertiseId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.expertiseId, adminRestriction, userContent);
        });

    router.route('/:expertiseId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.expertiseId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.expertiseId);
        });

    router.route('/:expertiseId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.expertiseId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });
};
