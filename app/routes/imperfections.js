'use strict';

const routes = require('../../lib/routes/generic/routes');
const relations = require('../../lib/routes/generic/relations/routes');
const basic = require('../../lib/routes/generic/generic');

module.exports = (router) => {
    const tableName = 'imperfection';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'imperfection.id, ' +
        'imperfection.canon, ' +
        'imperfection.name, ' +
        'imperfection.description, ' +
        'imperfection.icon, ' +
        'imperfection.created, ' +
        'imperfection.updated, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name, ' +
        'imperfection_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM imperfection ' +
        'LEFT JOIN imperfection_is_manifestation ON imperfection_is_manifestation.imperfection_id = imperfection.id ' +
        'LEFT JOIN imperfection_is_species ON imperfection_is_species.imperfection_id = imperfection.id ' +
        'LEFT JOIN imperfection_is_copy ON imperfection_is_copy.imperfection_id = imperfection.id ' +
        'LEFT JOIN manifestation ON manifestation.id = imperfection_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = imperfection_is_species.species_id ' +
        'LEFT JOIN user ON user.id = imperfection.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN imperfection_is_manifestation ON imperfection_is_manifestation.imperfection_id = imperfection.id ' +
                'WHERE ' +
                'imperfection.deleted IS NULL AND ' +
                'imperfection_is_manifestation.manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN imperfection_is_species ON imperfection_is_species.imperfection_id = imperfection.id ' +
                'WHERE ' +
                'imperfection.deleted IS NULL AND ' +
                'imperfection_is_species.species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'skill');
};
