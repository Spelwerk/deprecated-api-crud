'use strict';

let async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Returns an array of weapons
 *
 * @param table_name String
 * @param table_id String
 * @param tableId Integer
 * @param callback
 * @returns callback(err, array)
 */
function getTableArray(table_name, table_id, tableId, callback) {
    tableId = parseInt(tableId);

    let array = [];

    query('SELECT weapon_id AS id FROM ' + table_name + ' WHERE ' + table_id + ' = ?', [tableId], function(err, results) {
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
 * Returns an array of weapons
 *
 * @param creatureId Integer
 * @param callback
 * @returns callback(err, array)
 */
function getCreatureArray(creatureId, callback) {
    creatureId = parseInt(creatureId);

    let array = [];

    query('SELECT weapon_id AS id FROM creature_has_weapon WHERE creature_id = ?', [creatureId], function(err, results) {
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
 * Selects all weapons with a combination relation, and add it to the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param weapon_relation String
 * @param table_id String
 * @param tableId Integer
 * @param callback
 * @returns callback(err)
 */
function add(user, creatureId, weapon_relation, table_id, tableId, callback) {
    creatureId = parseInt(creatureId);
    tableId = parseInt(tableId);

    let creatureArray = [],
        tableArray = [],
        weaponArray = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            getTableArray(weapon_relation, table_id, tableId, function(err, array) {
                if(err) return callback(err);

                tableArray = array;

                callback();
            });
        },
        function(callback) {
            if(tableArray.length === 0) return callback();

            getCreatureArray(creatureId, function(err, array) {
                if(err) return callback(err);

                creatureArray = array;

                callback();
            });
        },
        function(callback) {
            if(tableArray.length === 0) return callback();

            for(let i in tableArray) {
                if(creatureArray.length !== 0 && creatureArray.indexOf(tableArray[i]) !== -1) continue;

                weaponArray.push(tableArray[i]);
            }

            callback();
        },
        function(callback) {
            if(weaponArray.length === 0) return callback();

            let sql = 'INSERT INTO creature_has_weapon (creature_id,weapon_id,equipped) VALUES ';

            // Create the query
            for(let i in weaponArray) {
                sql += '(' + creatureId + ',' + weaponArray[i] + ',1),';
            }

            sql = sql.slice(0, -1);

            query(sql, null, callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Selects all weapons with a combination relation, and remove it from the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param weapon_relation String
 * @param table_id String
 * @param tableId Integer
 * @param callback
 * @returns callback(err)
 */
function remove(user, creatureId, weapon_relation, table_id, tableId, callback) {
    creatureId = parseInt(creatureId);
    tableId = parseInt(tableId);

    let tableArray = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            getTableArray(weapon_relation, table_id, tableId, function(err, array) {
                if(err) return callback(err);

                tableArray = array;

                callback();
            });
        },
        function(callback) {
            if(tableArray.length === 0) return callback();

            let sql = 'DELETE FROM creature_has_weapon WHERE creature_id = ? AND (';

            // Create the query
            for(let i in tableArray) {
                sql += 'weapon_id = ' + tableArray[i] + ' OR ';
            }

            sql = sql.slice(0, -4) + ')';

            query(sql, [creatureId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

/** See documentation for: {@link #add} */
function addCombination(user, creatureId, tableName, tableId, callback) {
    let weapon_is_table = 'weapon_is_' + tableName,
        table_id = tableName + '_id';

    add(user, creatureId, weapon_is_table, table_id, tableId, callback);
}

/** See documentation for: {@link #remove} */
function removeCombination(user, creatureId, tableName, tableId, callback) {
    let weapon_is_table = 'weapon_is_' + tableName,
        table_id = tableName + '_id';

    remove(user, creatureId, weapon_is_table, table_id, tableId, callback);
}

/** See documentation for: {@link #add} */
function addRelation(user, creatureId, tableName, tableId, callback) {
    let table_has_weapon = tableName + '_has_weapon',
        table_id = tableName + '_id';

    add(user, creatureId, table_has_weapon, table_id, tableId, callback);
}

/** See documentation for: {@link #remove} */
function removeRelation(user, creatureId, tableName, tableId, callback) {
    let table_has_weapon = tableName + '_has_weapon',
        table_id = tableName + '_id';

    remove(user, creatureId, table_has_weapon, table_id, tableId, callback);
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.addCombination = addCombination;
module.exports.removeCombination = removeCombination;

module.exports.addRelation = addRelation;
module.exports.removeRelation = removeRelation;