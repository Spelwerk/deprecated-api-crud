'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const worlds = require('../../lib/tables/worlds');

module.exports = function(router) {
    const tableName = 'world';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'world.id, ' +
        'world.canon, ' +
        'world.template, ' +
        'world.name, ' +
        'world.description, ' +
        'world.min_age, ' +
        'world.created, ' +
        'world.updated, ' +
        'world_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM world ' +
        'LEFT JOIN world_is_copy ON world_is_copy.world_id = world.id ' +
        'LEFT JOIN user ON user.id = world.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await worlds.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) {
                return next(e);
            }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'country');
    relations.route(router, tableName, 'identity');
    relations.route(router, tableName, 'location');
    relations.route(router, tableName, 'nature');
};
