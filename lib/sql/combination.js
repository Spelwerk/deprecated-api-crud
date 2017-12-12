'use strict';

let query = require('./query');

/**
 * Adds optional ID relation in table_is_combination
 *
 * @param tableName String
 * @param tableId Integer
 * @param combinationName String
 * @param combinationId Integer
 * @param callback
 * @returns callback(err)
 */
function combination(tableName, tableId, combinationName, combinationId, callback) {
    tableId = parseInt(tableId);
    combinationId = parseInt(combinationId);

    let table_is_combination = tableName + '_is_' + combinationName,
        table_id = tableName + '_id',
        combination_id = combinationName + '_id';

    if(!combinationId) return callback();

    query('INSERT INTO ' + table_is_combination + ' (' + table_id + ',' + combination_id + ') VALUES (?,?) ON DUPLICATE KEY UPDATE ' + combination_id + ' = VALUES(' + combination_id + ')', [tableId, combinationId], callback);
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = combination;