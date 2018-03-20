'use strict';

const routes = require('../../lib/routes/generic/routes');
const relations = require('../../lib/routes/generic/relations/routes');
const basic = require('../../lib/routes/generic/generic');

module.exports = (router) => {
    const tableName = 'gift';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'gift.id, ' +
        'gift.canon, ' +
        'gift.name, ' +
        'gift.description, ' +
        'gift.icon, ' +
        'gift.created, ' +
        'gift.updated, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name, ' +
        'gift_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM gift ' +
        'LEFT JOIN gift_is_manifestation ON gift_is_manifestation.gift_id = gift.id ' +
        'LEFT JOIN gift_is_species ON gift_is_species.gift_id = gift.id ' +
        'LEFT JOIN gift_is_copy ON gift_is_copy.gift_id = gift.id ' +
        'LEFT JOIN manifestation ON manifestation.id = gift_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = gift_is_species.species_id ' +
        'LEFT JOIN user ON user.id = gift.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN gift_is_manifestation ON gift_is_manifestation.gift_id = gift.id ' +
                'WHERE ' +
                'gift.deleted IS NULL AND ' +
                'gift_is_manifestation.manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN gift_is_species ON gift_is_species.gift_id = gift.id ' +
                'WHERE ' +
                'gift.deleted IS NULL AND ' +
                'gift_is_species.species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'skill');
};
