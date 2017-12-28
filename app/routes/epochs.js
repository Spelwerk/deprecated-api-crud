'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');

module.exports = (router) => {
    const tableName = 'epoch';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'armours', 'armour');
    relations.route(router, tableName, 'assets', 'asset');
    relations.route(router, tableName, 'backgrounds', 'background');
    relations.route(router, tableName, 'bionics', 'bionic');
    relations.route(router, tableName, 'corporations', 'corporation');
    relations.route(router, tableName, 'expertises', 'expertise');
    relations.route(router, tableName, 'gifts', 'gift');
    relations.route(router, tableName, 'identities', 'identity');
    relations.route(router, tableName, 'imperfections', 'imperfection');
    relations.route(router, tableName, 'manifestations', 'manifestation');
    relations.route(router, tableName, 'milestones', 'milestone');
    relations.route(router, tableName, 'shields', 'shield');
    relations.route(router, tableName, 'skills', 'skill');
    relations.route(router, tableName, 'software', 'software');
    relations.route(router, tableName, 'wealth', 'wealth');
    relations.route(router, tableName, 'weapons', 'weapon');
};
