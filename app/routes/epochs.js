'use strict';

let generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

module.exports = function(router) {
    const tableName = 'epoch';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);
    generic.post(router, tableName);
    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);
    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);

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
