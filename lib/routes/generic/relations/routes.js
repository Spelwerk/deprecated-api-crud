'use strict';

const getSchema = require('../../../../app/initializers/database').getSchema;
const defaults = require('./defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

function route(router, tableName, relationName, query) {
    let rootQuery;
    let itemQuery;

    if (query) {
        rootQuery = query;
        itemQuery = query;
    } else {
        const table_has_relation = tableName + '_has_' + relationName;
        const relation_id = relationName + '_id';
        const schema = getSchema(table_has_relation);

        rootQuery = 'SELECT ' + relation_id + ' AS id, name';

        if (schema.fields.all.indexOf('value') !== -1) {
            rootQuery += ', value';
        }

        rootQuery += ' FROM ' + table_has_relation + ' ' +
            'LEFT JOIN ' + relationName + ' ON ' + relationName + '.id = ' + table_has_relation + '.' + relation_id;

        itemQuery = 'SELECT * ' +
            'FROM ' + table_has_relation + ' ' +
            'LEFT JOIN ' + relationName + ' ON ' + relationName + '.id = ' + table_has_relation + '.' + relation_id;
    }

    defaults.rootGet(router, tableName, relationName, rootQuery);
    defaults.rootPost(router, tableName, relationName);
    defaults.itemGet(router, tableName, relationName, itemQuery);
    defaults.itemPut(router, tableName, relationName);
    defaults.itemDelete(router, tableName, relationName);
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.route = route;
