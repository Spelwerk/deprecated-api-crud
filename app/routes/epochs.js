'use strict';

const routes = require('../../lib/routes/generic/routes');
const relations = require('../../lib/routes/generic/relations/routes');
const epochRelations = require('../../lib/routes/epochs/relations/routes');

module.exports = (router) => {
    const tableName = 'epoch';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'epoch.id, ' +
        'epoch.canon, ' +
        'epoch.name, ' +
        'epoch.description, ' +
        'epoch.history, ' +
        'epoch.begins, ' +
        'epoch.ends, ' +
        'epoch.augmentation, ' +
        'epoch.created, ' +
        'epoch.updated, ' +
        'world.id AS world_id, ' +
        'world.name AS world_name, ' +
        'epoch_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM epoch ' +
        'LEFT JOIN epoch_is_copy ON epoch_is_copy.epoch_id = epoch.id ' +
        'LEFT JOIN world ON world.id = epoch.world_id ' +
        'LEFT JOIN user ON user.id = epoch.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Epoch Relations

    epochRelations.backgrounds(router);
    epochRelations.expertises(router);
    epochRelations.gifts(router);
    epochRelations.imperfections(router);
    epochRelations.manifestations(router);
    epochRelations.milestones(router);

    // Generic Relations

    relations.route(router, tableName, 'armour');
    relations.route(router, tableName, 'asset');
    relations.route(router, tableName, 'bionic');
    relations.route(router, tableName, 'corporation');
    relations.route(router, tableName, 'location');
    relations.route(router, tableName, 'shield');
    relations.route(router, tableName, 'skill');
    relations.route(router, tableName, 'software');
    relations.route(router, tableName, 'wealth');
    relations.route(router, tableName, 'weapon');
};
