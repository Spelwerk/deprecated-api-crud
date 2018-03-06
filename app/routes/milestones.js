'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const basic = require('../../lib/generic/basics');
const milestones = require('../../lib/tables/milestones');

module.exports = (router) => {
    const tableName = 'milestone';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'milestone.id, ' +
        'milestone.canon, ' +
        'milestone.name, ' +
        'milestone.description, ' +
        'milestone.created, ' +
        'milestone.updated, ' +
        'background.id AS background_id, ' +
        'background.name AS background_name, ' +
        'background.icon AS background_icon, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'manifestation.icon AS manifestation_icon, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name, ' +
        'species.icon AS species_icon, ' +
        'milestone_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM milestone ' +
        'LEFT JOIN milestone_is_background ON milestone_is_background.milestone_id = milestone.id ' +
        'LEFT JOIN milestone_is_manifestation ON milestone_is_manifestation.milestone_id = milestone.id ' +
        'LEFT JOIN milestone_is_species ON milestone_is_species.milestone_id = milestone.id ' +
        'LEFT JOIN milestone_is_copy ON milestone_is_copy.milestone_id = milestone.id ' +
        'LEFT JOIN background ON background.id = milestone_is_background.background_id ' +
        'LEFT JOIN manifestation ON manifestation.id = milestone_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = milestone_is_species.species_id ' +
        'LEFT JOIN user ON user.id = milestone.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/background/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN milestone_is_background ON milestone_is_background.milestone_id = milestone.id ' +
                'WHERE ' +
                'milestone.deleted IS NULL AND ' +
                'milestone_is_background.background_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN milestone_is_manifestation ON milestone_is_manifestation.milestone_id = milestone.id ' +
                'WHERE ' +
                'milestone.deleted IS NULL AND ' +
                'milestone_is_manifestation.manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN milestone_is_species ON milestone_is_species.milestone_id = milestone.id ' +
                'WHERE ' +
                'milestone.deleted IS NULL AND ' +
                'milestone_is_species.species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Loyalties

    milestones.loyalties(router);

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
