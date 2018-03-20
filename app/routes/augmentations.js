'use strict';

const routes = require('../../lib/routes/generic/routes');
const relations = require('../../lib/routes/generic/relations/routes');
const augmentations = require('../../lib/routes/augmentations/augmentations');

module.exports = (router) => {
    const tableName = 'augmentation';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'augmentation.id, ' +
        'augmentation.canon, ' +
        'augmentation.name, ' +
        'augmentation.description, ' +
        'augmentation.legal, ' +
        'augmentation.price, ' +
        'augmentation.hacking_difficulty, ' +
        'augmentation.created, ' +
        'augmentation.updated, ' +
        'corporation.id AS corporation_id, ' +
        'corporation.name AS corporation_name, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name, ' +
        'augmentation_is_copy.copy_id ' +
        'FROM augmentation ' +
        'LEFT JOIN augmentation_is_corporation ON augmentation_is_corporation.augmentation_id = augmentation.id ' +
        'LEFT JOIN augmentation_is_copy ON augmentation_is_copy.augmentation_id = augmentation.id ' +
        'LEFT JOIN corporation ON corporation.id = augmentation_is_corporation.corporation_id ' +
        'LEFT JOIN user ON user.id = augmentation.user_id';
    
    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await augmentations.insert(req, req.body);

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
    relations.route(router, tableName, 'skill');
    relations.route(router, tableName, 'software');
};
