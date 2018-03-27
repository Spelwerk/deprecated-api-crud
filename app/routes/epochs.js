'use strict';

const routes = require('../../lib/routes/generic/routes');
const relations = require('../../lib/routes/generic/relations/routes');

const armours = require('../../lib/routes/epochs/relations/armours');
const backgrounds = require('../../lib/routes/epochs/relations/backgrounds');
const expertises = require('../../lib/routes/epochs/relations/expertises');
const gifts = require('../../lib/routes/epochs/relations/gifts');
const imperfections = require('../../lib/routes/epochs/relations/imperfections');
const manifestations = require('../../lib/routes/epochs/relations/manifestations');
const milestones = require('../../lib/routes/epochs/relations/milestones');
const weapons = require('../../lib/routes/epochs/relations/weapons');

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

    armours(router);
    backgrounds(router);
    expertises(router);
    gifts(router);
    imperfections(router);
    manifestations(router);
    milestones(router);
    weapons(router);

    // Generic Relations

    relations.route(router, tableName, 'asset');
    relations.route(router, tableName, 'bionic');
    relations.route(router, tableName, 'corporation');
    relations.route(router, tableName, 'country');
    relations.route(router, tableName, 'identity');
    relations.route(router, tableName, 'location');
    relations.route(router, tableName, 'nature');
    relations.route(router, tableName, 'shield');
    relations.route(router, tableName, 'skill');
    relations.route(router, tableName, 'software');
    relations.route(router, tableName, 'wealth');
};
