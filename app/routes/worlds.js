'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const worlds = require('../../lib/tables/worlds');

module.exports = function(router) {
    const tableName = 'world';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await worlds.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) {
                return next(e);
            }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'country');
    relations.route(router, tableName, 'identity');
    relations.route(router, tableName, 'location');
    relations.route(router, tableName, 'nature');
};
