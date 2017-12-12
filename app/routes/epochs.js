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

    relations(router, tableName, 'armours', 'armour');
    relations(router, tableName, 'assets', 'asset');
    relations(router, tableName, 'backgrounds', 'background');
    relations(router, tableName, 'bionics', 'bionic');
    relations(router, tableName, 'corporations', 'corporation');
    relations(router, tableName, 'expertises', 'expertise');
    relations(router, tableName, 'gifts', 'gift');
    relations(router, tableName, 'identities', 'identity');
    relations(router, tableName, 'imperfections', 'imperfection');
    relations(router, tableName, 'manifestations', 'manifestation');
    relations(router, tableName, 'milestones', 'milestone');
    relations(router, tableName, 'shields', 'shield');
    relations(router, tableName, 'skills', 'skill');
    relations(router, tableName, 'software', 'software');
    relations(router, tableName, 'wealth', 'wealth');
    relations(router, tableName, 'weapons', 'weapon');
};
