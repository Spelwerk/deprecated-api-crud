'use strict';

let generic = require('../../lib/helper/generic'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    const tableName = 'expertise';

    let sql = 'SELECT ' +
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
        'expertise_is_copy.copy_id, ' +
        'expertise_is_manifestation.manifestation_id, ' +
        'expertise_is_species.species_id ' +
        'FROM expertise ' +
        'LEFT JOIN expertise_is_copy ON expertise_is_copy.expertise_id = expertise.id ' +
        'LEFT JOIN expertise_is_manifestation ON expertise_is_manifestation.expertise_id = expertise.id ' +
        'LEFT JOIN expertise_is_species ON expertise_is_species.expertise_id = expertise.id ' +
        'LEFT JOIN skill ON skill.id = expertise.skill_id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName);
    generic.deleted(router, tableName, sql);

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    router.route('/skill/:skillId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'skill_id = ?';

            sequel.get(req, res, next, call, [req.params.skillId]);
        });

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    router.route('/skill/:skillId/manifestation/:manifestationId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'skill_id = ? AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId, req.params.skillId]);
        });

    router.route('/skill/:skillId/species/:speciesId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE expertise.deleted IS NULL AND ' +
                'skill_id = ? AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.skillId, req.params.speciesId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);
};
