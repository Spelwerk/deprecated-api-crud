'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/relations/generic');
const manifestations = require('../../lib/tables/manifestations');

module.exports = (router) => {
    const tableName = 'manifestation';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'manifestation.id, ' +
        'manifestation.canon, ' +
        'manifestation.name, ' +
        'manifestation.description, ' +
        'manifestation.icon, ' +
        'manifestation.created, ' +
        'manifestation.updated, ' +
        'manifestation_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM manifestation ' +
        'LEFT JOIN manifestation_is_copy ON manifestation_is_copy.manifestation_id = manifestation.id ' +
        'LEFT JOIN user ON user.id = manifestation.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await manifestations.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
};
