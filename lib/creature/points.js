'use strict';

let DatabaseRowNotFoundError = require('../errors/database-row-not-found-error');

let async = require('async');

let query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Changes point to value
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param changeValue Integer
 * @param callback
 * @returns callback(err)
 */
function change(user, creatureId, tableName, changeValue, callback) {
    creatureId = parseInt(creatureId);
    changeValue = parseInt(changeValue);

    let points_table = 'points_' + tableName,
        currentValue;

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('SELECT * FROM creature_with_points WHERE creature_id = ?', [creatureId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback(new DatabaseRowNotFoundError);

                currentValue = parseInt(results[0][points_table]);

                callback();
            });
        },
        function(callback) {
            let points = currentValue + changeValue;

            query('UPDATE creature_with_points SET ' + points_table + ' = ? WHERE creature_id = ?', [points, creatureId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Calculates points from two values
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param changeFrom Integer
 * @param changeTo Integer
 * @param callback
 * @returns callback(err)
 */
function calculate(user, creatureId, tableName, changeFrom, changeTo, callback) {
    creatureId = parseInt(creatureId);
    changeFrom = parseInt(changeFrom);
    changeTo = parseInt(changeTo);

    // Calculating the value
    let value = 0,
        from,
        to;

    from = changeFrom < changeTo
        ? changeFrom + 1
        : changeTo;

    to = changeFrom < changeTo
        ? changeTo
        : changeFrom;

    for(let i = from; i <= to; i++) {
        value += i;
    }

    value = changeFrom < changeTo
        ? -value
        : value;

    change(user, creatureId, tableName, value, callback);
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.change = change;
module.exports.calculate = calculate;