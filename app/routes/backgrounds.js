'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/relations/generic');
const basic = require('../../lib/generic/basics');

module.exports = (router) => {
    const tableName = 'background';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;
    
    const singleQuery = 'SELECT ' +
        'background.id, ' +
        'background.canon, ' +
        'background.name, ' +
        'background.description, ' +
        'background.icon, ' +
        'background.created, ' +
        'background.updated, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name, ' +
        'background_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM background ' +
        'LEFT JOIN background_is_manifestation ON background_is_manifestation.background_id = background.id ' +
        'LEFT JOIN background_is_species ON background_is_species.background_id = background.id ' +
        'LEFT JOIN background_is_copy ON background_is_copy.background_id = background.id ' +
        'LEFT JOIN manifestation ON manifestation.id = background_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = background_is_species.species_id ' +
        'LEFT JOIN user ON user.id = background.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN background_is_manifestation ON background_is_manifestation.background_id = background.id ' +
                'WHERE ' +
                'background.deleted IS NULL AND ' +
                'background_is_manifestation.manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN background_is_species ON background_is_species.background_id = background.id ' +
                'WHERE ' +
                'background.deleted IS NULL AND ' +
                'background_is_species.species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
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
