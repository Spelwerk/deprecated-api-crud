'use strict';

const routes = require('../../lib/generic/routes');
const basic = require('../../lib/generic/basics');

module.exports = function(router) {
    const tableName = 'expertise';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'expertise.id, ' +
        'expertise.canon, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'skill.icon, ' +
        'expertise.maximum, ' +
        'expertise.created, ' +
        'expertise.updated, ' +
        'skill.id AS skill_id, ' +
        'skill.name AS skill_name, ' +
        'expertise.skill_requirement, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name, ' +
        'expertise_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM expertise ' +
        'LEFT JOIN expertise_is_manifestation ON expertise_is_manifestation.expertise_id = expertise.id ' +
        'LEFT JOIN expertise_is_species ON expertise_is_species.expertise_id = expertise.id ' +
        'LEFT JOIN expertise_is_copy ON expertise_is_copy.expertise_id = expertise.id ' +
        'LEFT JOIN skill ON skill.id = expertise.skill_id ' +
        'LEFT JOIN manifestation ON manifestation.id = expertise_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = expertise_is_species.species_id ' +
        'LEFT JOIN user ON user.id = expertise.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN expertise_is_manifestation ON expertise_is_manifestation.expertise_id = expertise.id ' +
                'WHERE ' +
                'expertise.deleted IS NULL AND ' +
                'expertise_is_manifestation.manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/skill/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'WHERE ' +
                'expertise.deleted IS NULL AND ' +
                'expertise.skill_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN expertise_is_species ON expertise_is_species.expertise_id = expertise.id ' +
                'WHERE ' +
                'expertise.deleted IS NULL AND ' +
                'expertise_is_species.species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/skill/:skill/manifestation/:manifestation')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN expertise_is_manifestation ON expertise_is_manifestation.expertise_id = expertise.id ' +
                'WHERE ' +
                'expertise.deleted IS NULL AND ' +
                'expertise.skill_id = ? AND ' +
                'expertise_is_manifestation.manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.skill, req.params.manifestation]);
        });

    router.route('/skill/:skill/species/:species')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN expertise_is_species ON expertise_is_species.expertise_id = expertise.id ' +
                'WHERE ' +
                'expertise.deleted IS NULL AND ' +
                'expertise.skill_id = ? AND ' +
                'expertise_is_species.species_id = ?';

            await basic.select(req, res, next, call, [req.params.skill, req.params.species]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
