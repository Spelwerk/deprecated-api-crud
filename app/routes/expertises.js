'use strict';

const routes = require('../../lib/generic/routes');
const basic = require('../../lib/generic/basic');

module.exports = function(router) {
    const tableName = 'expertise';

    let query = 'SELECT ' +
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

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE expertise.deleted IS NULL AND ' +
                'manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/skill/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE expertise.deleted IS NULL AND ' +
                'skill_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE expertise.deleted IS NULL AND ' +
                'species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/skill/:skill/manifestation/:manifestation')
        .get(async (req, res, next) => {
            let call = query + ' WHERE expertise.deleted IS NULL AND ' +
                'skill_id = ? AND ' +
                'manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.skill, req.params.manifestation]);
        });

    router.route('/skill/:skill/species/:species')
        .get(async (req, res, next) => {
            let call = query + ' WHERE expertise.deleted IS NULL AND ' +
                'skill_id = ? AND ' +
                'species_id = ?';

            await basic.select(req, res, next, call, [req.params.skill, req.params.species]);
        });

    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
