'use strict';

let async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

let value = require('./value');

/**
 * Selects all bionics related to a table row, and add it to the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param tableId Integer
 * @param callback
 * @returns callback(err)
 */
function add(user, creatureId, tableName, tableId, callback) {
    creatureId = parseInt(creatureId);
    tableId = parseInt(tableId);

    let table_has_bionic = tableName + '_has_bionic',
        table_id = tableName + '_id';

    let creatureArray = [],
        tableArray = [],
        bionicArray = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('SELECT bionic_id AS id FROM ' + table_has_bionic + ' WHERE ' + table_id + ' = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                if(results.length !== 0) {
                    for(let i in results) {
                        tableArray.push(parseInt(results[i].id));
                    }
                }

                callback();
            });
        },
        function(callback) {
            if(tableArray.length === 0) return callback();

            query('SELECT bionic_id AS id FROM creature_has_bionic WHERE creature_id = ?', [creatureId], function(err, results) {
                if(err) return callback(err);

                if(results.length !== 0) {
                    for(let i in results) {
                        creatureArray.push(parseInt(results[i].id));
                    }
                }

                callback();
            });
        },
        function(callback) {
            if (tableArray.length === 0) return callback();

            for (let i in tableArray) {
                if (creatureArray.length !== 0 && creatureArray.indexOf(tableArray[i]) !== -1) continue;

                bionicArray.push(tableArray[i]);
            }

            callback();
        },
        function(callback) {
            if(bionicArray.length === 0) return callback();

            let sql = 'INSERT INTO creature_has_bionic (creature_id,bionic_id) VALUES ';

            for(let i in bionicArray) {
                sql += '(' + creatureId + ',' + bionicArray[i] + '),';
            }

            sql = sql.slice(0, -1);

            query(sql, null, callback);
        },
        function(callback) {
            if(bionicArray.length === 0) return callback();

            async.each(bionicArray, function(bionicId, next) {
                value.add(user, creatureId, 'bionic', bionicId, {ignoreArray: ['augmentation', 'software']}, next);
            }, function(err) {
                callback(err);
            });
        }
    ], function(err) {
        callback(err);
    });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.add = add;
