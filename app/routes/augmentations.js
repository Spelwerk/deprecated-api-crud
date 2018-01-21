'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const augmentations = require('../../lib/tables/augmentations');

module.exports = (router) => {
    const tableName = 'augmentation';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await augmentations.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) {
                next(e);
            }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
    relations.route(router, tableName, 'expertises', 'expertise');
    relations.route(router, tableName, 'skills', 'skill');
    relations.route(router, tableName, 'software', 'software');
};
