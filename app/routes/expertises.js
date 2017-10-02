'use strict';

var generic = require('../../lib/helper/generic'),
    sequel = require('../../lib/sql/sequel'),
    expertises = require('../../lib/tables/expertises');

module.exports = function(router) {
    var tableName = 'expertise';

    var sql = 'SELECT ' +
        'expertise.id, ' +
        'expertise.user_id, ' +
        'expertise.canon, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'expertise.skill_id, ' +
        'expertise.created, ' +
        'expertise.updated, ' +
        'expertise.deleted, ' +
        'skill.icon, ' +
        'expertise_is_copy.original_id, ' +
        'expertise_is_manifestation.manifestation_id, ' +
        'expertise_is_species.species_id ' +
        'FROM expertise ' +
        'LEFT JOIN expertise_is_copy ON expertise_is_copy.expertise_id = expertise.id ' +
        'LEFT JOIN expertise_is_manifestation ON expertise_is_manifestation.expertise_id = expertise.id ' +
        'LEFT JOIN expertise_is_species ON expertise_is_species.expertise_id = expertise.id ' +
        'LEFT JOIN skill ON skill.id = expertise.skill_id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var name = req.body.name,
                description = req.body.description,
                skillId = req.body.skill_id,
                manifestationId = req.body.manifestation_id,
                speciesId = req.body.species_id;

            expertises.post(req.user, name, description, skillId, manifestationId, speciesId, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    generic.deleted(router, tableName, sql);

    // Manifestations

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    // Skills

    router.route('/skill/:skillId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'skill_id = ?';

            sequel.get(req, res, next, call, [req.params.skillId]);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // Skills & Manifestations

    router.route('/skill/:skillId/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'skill_id = ? AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId, req.params.skillId]);
        });

    // Skills & Species

    router.route('/skill/:skillId/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'skill_id = ? AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.skillId, req.params.speciesId]);
        });

    // ID

    generic.get(router, tableName, sql);
    generic.put(router, tableName, false, true);
    generic.delete(router, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
