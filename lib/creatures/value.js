'use strict';

let DatabaseRowNotFoundError = require('../errors/database-row-not-found-error');

let async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership'),
    getSchema = require('../../app/initializers/database').getSchema;

/**
 * Changes the value of a relation by getting the current value and adding/subtracting to it
 *
 * @param user Object
 * @param creatureId Integer
 * @param relationName String
 * @param relationId Integer
 * @param value Integer
 * @param callback
 * @returns callback(err)
 */
function change(user, creatureId, relationName, relationId, value, callback) {
    creatureId = parseInt(creatureId);
    relationId = parseInt(relationId);
    value = parseInt(value);

    let creature_has_relation = 'creature_has_' + relationName,
        relation_id = relationName + '_id';

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },

        // Getting current value
        function(callback) {
            query('SELECT value FROM ' + creature_has_relation + ' WHERE creature_id = ? AND ' + relation_id + ' = ?', [creatureId, relationId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback(new DatabaseRowNotFoundError);

                value += parseInt(results[0].value);

                callback();
            });
        },

        // Setting value
        function(callback) {
            query('UPDATE ' + creature_has_relation + ' SET value = ? WHERE creature_id = ? AND ' + relation_id + ' = ?', [value, creatureId, relationId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Adds values from relation table to the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param relationName String
 * @param additionId Integer
 * @param subtractId Integer
 * @param callback
 * @returns callback(err)
 */
function update(user, creatureId, tableName, relationName, additionId, subtractId, callback) {
    creatureId = parseInt(creatureId);
    additionId = parseInt(additionId) || null;
    subtractId = parseInt(subtractId) || null;

    let creature_has_relation = 'creature_has_' + relationName,
        table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id';

    let creatureArray = [],
        additionArray = [],
        subtractArray = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },

        // Getting the values
        function(callback) {
            if(!additionId && !subtractId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + creature_has_relation + ' WHERE creature_id = ?', [creatureId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                for(let i in results) {
                    let id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    creatureArray.push({id: id, value: value, changed: false});
                }

                callback();
            });
        },
        function(callback) {
            if(!additionId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ?', [additionId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                for(let i in results) {
                    let id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    additionArray.push({id: id, value: value, changed: false});
                }

                callback();
            });
        },
        function(callback) {
            if(!subtractId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ?', [subtractId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                for(let i in results) {
                    let id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    subtractArray.push({id: id, value: value, changed: false});
                }

                callback();
            });
        },

        // Setting the values
        function(callback) {
            if(!additionId && !subtractId) return callback();

            if(additionArray.length === 0 && subtractArray.length === 0) return callback();

            let sql = 'INSERT INTO ' + creature_has_relation + ' (creature_id,' + relation_id + ',value) VALUES ',
                sqlHasChanged = false;

            // Loop through the current creature array
            for(let i in creatureArray) {

                // Loop through the addition array
                if(additionArray.length !== 0) {
                    for(let x in additionArray) {

                        // If IDs are matched, add to creature array and mark as changed
                        if(creatureArray[i].id === additionArray[x].id) {
                            creatureArray[i].value = parseInt(creatureArray[i].value) + parseInt(additionArray[x].value);
                            creatureArray[i].changed = true;
                            additionArray[x].changed = true;
                        }
                    }
                }

                // Loop through the subtraction array
                if(subtractArray.length !== 0) {
                    for(let x in subtractArray) {

                        // If IDs are matched, subtract from creature array and mark as changed
                        if(creatureArray[i].id === subtractArray[x].id) {
                            creatureArray[i].value = parseInt(creatureArray[i].value) - parseInt(subtractArray[x].value);
                            creatureArray[i].changed = true;
                            subtractArray[x].changed = true;
                        }
                    }
                }
            }

            for(let i in creatureArray) {
                if(creatureArray[i].changed === true) {
                    sql += '(' + creatureId + ',' + creatureArray[i].id + ',' + creatureArray[i].value + '),';
                    sqlHasChanged = true;
                }
            }

            for(let i in additionArray) {
                if(additionArray[i].changed === false) {
                    sql += '(' + creatureId + ',' + additionArray[i].id + ',' + additionArray[i].value + '),';
                    sqlHasChanged = true;
                }
            }

            for(let i in subtractArray) {
                if(subtractArray[i].changed === false) {
                    sql += '(' + creatureId + ',' + subtractArray[i].id + ',' + subtractArray[i].value + '),';
                    sqlHasChanged = true;
                }
            }

            if(!sqlHasChanged) return callback();

            sql = sql.slice(0, -1) + ' ON DUPLICATE KEY UPDATE value = VALUES(value)';

            query(sql, null, callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Loop through an array of relation tables and add values to the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param additionId Integer
 * @param subtractId Integer
 * @param options Object
 * @param callback
 * @returns callback(err)
 */
function updateMany(user, creatureId, tableName, additionId, subtractId, options, callback) {
    options = options || {};

    let schema = getSchema(tableName),
        schemaArray = schema.tables.hasMany,
        ignoreArray = options.ignoreArray || [],
        relationArray = [];

    for(let i in schemaArray) {
        if(ignoreArray.indexOf(schemaArray[i]) !== -1) continue;

        relationArray.push(schemaArray[i]);
    }

    if(relationArray.length === 0) return callback();

    async.each(relationArray, function(relationName, next) {
        update(user, creatureId, tableName, relationName, additionId, subtractId, next);
    }, function(err) {
        callback(err);
    });
}

/** See documentation for: {@link #updateMany} */
function add(user, creatureId, tableName, relationId, options, callback) {
    updateMany(user, creatureId, tableName, relationId, null, options, callback);
}

/** See documentation for: {@link #updateMany} */
function subtract(user, creatureId, tableName, relationId, options, callback) {
    updateMany(user, creatureId, tableName, null, relationId, options, callback);
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.change = change;

module.exports.update = update;
module.exports.updateMany = updateMany;

module.exports.add = add;
module.exports.subtract = subtract;
