'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const basic = require('../../lib/generic/basics');

module.exports = (router) => {
    const tableName = 'background';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_manifestation ON ' + tableName + '_is_manifestation.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_species ON ' + tableName + '_is_species.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'armour');
    relations.route(router, tableName, 'asset');
    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'bionic');
    relations.route(router, tableName, 'primal');
    relations.route(router, tableName, 'shield');
    relations.route(router, tableName, 'skill');
    relations.route(router, tableName, 'weapon');
};
