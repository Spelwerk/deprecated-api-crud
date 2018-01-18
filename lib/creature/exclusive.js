'use strict';

let async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Returns a list of IDs from a table relation/combination
 * @deprecated
 * @param relation_item String
 * @param tableName String
 * @param tableId Integer
 * @param itemName String
 * @param callback
 * @returns callback(err, array)
 */
function getTableArray(relation_item, tableName, tableId, itemName, callback) {
    tableId = parseInt(tableId);

    let table_id = tableName + '_id',
        item_id = itemName + '_id';

    let array = [];

    query('SELECT ' + item_id + ' AS id FROM ' + relation_item + ' WHERE ' + table_id + ' = ?', [tableId], function(err, results) {
        if(err) return callback(err);

        if(results.length !== 0) {
            for(let i in results) {
                array.push(parseInt(results[i].id));
            }
        }

        callback(null, array);
    });
}

/**
 * Returns a list of IDs from creature relation
 * @deprecated
 * @param creatureId Integer
 * @param itemName String
 * @param callback
 * @returns callback(err, array)
 */
function getCreatureArray(creatureId, itemName, callback) {
    creatureId = parseInt(creatureId);

    let creature_has_item = 'creature_has_' + itemName;

    getTableArray(creature_has_item, 'creature', creatureId, itemName, callback);
}

/**
 * Adds exclusive items to a creature
 * @deprecated
 * @param user Object
 * @param creatureId Integer
 * @param relation_item String
 * @param tableName String
 * @param tableId Integer
 * @param itemName String
 * @param equipped Boolean
 * @param callback
 * @returns callback(err)
 */
function add(user, creatureId, relation_item, tableName, tableId, itemName, equipped, callback) {
    creatureId = parseInt(creatureId);
    tableId = parseInt(tableId);
    equipped = !!equipped;

    let creatureArray = [],
        tableArray = [],
        itemArray = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            getTableArray(relation_item, tableName, tableId, itemName, function(err, array) {
                if(err) return callback(err);

                tableArray = array;

                callback();
            });
        },
        function(callback) {
            if(tableArray.length === 0) return callback();

            getCreatureArray(creatureId, itemName, function(err, array) {
                if(err) return callback(err);

                creatureArray = array;

                callback();
            });
        },
        function(callback) {
            if(tableArray.length === 0) return callback();

            for(let i in tableArray) {
                if(creatureArray.length !== 0 && creatureArray.indexOf(tableArray[i]) !== -1) continue;

                itemArray.push(tableArray[i]);
            }

            callback();
        },
        function(callback) {
            if(itemArray.length === 0) return callback();

            let creature_has_item = 'creature_has_' + itemName,
                item_id = itemName + '_id';

            let sql = 'INSERT INTO ' + creature_has_item + ' (creature_id,' + item_id + ',equipped) VALUES ';

            for(let i in itemArray) {
                sql += '(' + creatureId + ',' + itemArray[i] + ',' + equipped + '),';
            }

            sql = sql.slice(0, -1);

            query(sql, null, callback);
        }
    ], function(err) {
        callback(err);
    });
}

/** @deprecated See documentation for: {@link #add} */
function addFromRelation(user, creatureId, tableName, tableId, itemName, equipped, callback) {
    let table_has_item = tableName + '_has_' + itemName;

    add(user, creatureId, table_has_item, tableName, tableId, itemName, equipped, callback);
}

/** @deprecated See documentation for: {@link #add} */
function addFromCombination(user, creatureId, tableName, tableId, itemName, equipped, callback) {
    let item_is_table = itemName + '_is_' + tableName;

    add(user, creatureId, item_is_table, tableName, tableId, itemName, equipped, callback);
}

/**
 * Removes exclusive items from a creature
 * @deprecated
 * @param user Object
 * @param creatureId Integer
 * @param relation_item String
 * @param tableName String
 * @param tableId Integer
 * @param itemName String
 * @param callback
 * @returns callback(err)
 */
function remove(user, creatureId, relation_item, tableName, tableId, itemName, callback) {
    creatureId = parseInt(creatureId);
    tableId = parseInt(tableId);

    let tableArray = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            getTableArray(relation_item, tableName, tableId, itemName, function(err, array) {
                if(err) return callback(err);

                tableArray = array;

                callback();
            });
        },
        function(callback) {
            if(tableArray.length === 0) return callback();

            let creature_has_item = 'creature_has_' + itemName,
                item_id = itemName + '_id';

            let sql = 'DELETE FROM ' + creature_has_item + ' WHERE creature_id = ? AND (';

            // Create the query
            for(let i in tableArray) {
                sql += item_id + ' = ' + tableArray[i] + ' OR ';
            }

            sql = sql.slice(0, -4) + ')';

            query(sql, [creatureId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

/** @deprecated See documentation for: {@link #remove} */
function removeFromRelation(user, creatureId, tableName, tableId, itemName, callback) {
    let table_has_item = tableName + '_has_' + itemName;

    remove(user, creatureId, table_has_item, tableName, tableId, itemName, callback);
}

/** @deprecated See documentation for: {@link #remove} */
function removeFromCombination(user, creatureId, tableName, tableId, itemName, callback) {
    let item_is_table = itemName + '_is_' + tableName;

    remove(user, creatureId, item_is_table, tableName, tableId, itemName, callback);
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.getTableArray = getTableArray;
module.exports.getCreatureArray = getCreatureArray;

module.exports.addFromCombination = addFromCombination;
module.exports.removeFromCombination = removeFromCombination;

module.exports.addFromRelation = addFromRelation;
module.exports.removeFromRelation = removeFromRelation;
