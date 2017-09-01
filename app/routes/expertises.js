var sequel = require('../../lib/sql/sequel'),
    generic = require('../../lib/sql/generic');

var basic = require('./../../lib/generic/basic');

module.exports = function(router) {
    'use strict';

    var tableName = 'expertise';

    var sql = 'SELECT ' +
        'expertise.generic_id, ' +
        'expertise.skill_id, ' +
        'expertise.species_id, ' +
        'expertise.manifestation_id, ' +
        'g1.id, ' +
        'g1.user_id, ' +
        'g1.original_id, ' +
        'g1.canon, ' +
        'g1.name, ' +
        'g1.description, ' +
        'g2.icon, ' +
        'g1.created, ' +
        'g1.updated, ' +
        'g1.deleted ' +
        'FROM expertise ' +
        'LEFT JOIN skill ON skill.generic_id = expertise.skill_id ' +
        'LEFT JOIN generic g1 ON g1.id = expertise.generic_id ' +
        'LEFT JOIN generic g2 ON g2.id = skill.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE g1.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            generic.post(req, res, next, tableName);
        });

    // Manifestations

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE g1.deleted IS NULL AND ' +
                'expertise.manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // Skills

    router.route('/skill/:skillId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE g1.deleted IS NULL AND ' +
                'expertise.skill_id = ?';

            sequel.get(req, res, next, call, [req.params.skillId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE g1.deleted IS NULL AND ' +
                'expertise.species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // Skills & Manifestations

    router.route('/skill/:skillId/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE g1.deleted IS NULL AND ' +
                'expertise.skill_id = ? AND ' +
                'expertise.manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId, req.params.skillId]);
        });

    // Skills & Species

    router.route('/skill/:skillId/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE g1.deleted IS NULL AND ' +
                'expertise.skill_id = ? AND ' +
                'expertise.species_id = ?';

            sequel.get(req, res, next, call, [req.params.skillId, req.params.speciesId]);
        });

    // ID

    router.route('/:id')
        .get(function(req, res, next) {
            var call = sql + ' WHERE g1.deleted IS NULL AND ' +
                'g1.id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .put(function(req, res, next) {
            generic.put(req, res, next, tableName, req.params.id);
        })
        .delete(function(req, res, next) {
            generic.delete(req, res, next, req.params.id);
        });

    basic.canon(router);
    basic.clone(router, tableName);
    basic.comments(router);
    basic.ownership(router);
};
