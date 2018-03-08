'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const basic = require('../../lib/generic/basics');
const species = require('../../lib/tables/species');

module.exports = (router) => {
    const tableName = 'species';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'species.id, ' +
        'species.canon, ' +
        'species.name, ' +
        'species.description, ' +
        'species.history, ' +
        'species.icon, ' +
        'species.playable, ' +
        'species.manifestation, ' +
        'species.max_age, ' +
        'species.multiply_points, ' +
        'species.created, ' +
        'species.updated, ' +
        'world.id AS world_id, ' +
        'world.name AS world_name, ' +
        'species_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM species ' +
        'LEFT JOIN species_is_copy ON species_is_copy.species_id = species.id ' +
        'LEFT JOIN world ON world.id = species.world_id ' +
        'LEFT JOIN user ON user.id = species.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await species.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/world/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'world_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
};
