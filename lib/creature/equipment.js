'use strict';

let async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

let value = require('./value');

/**
 * Sets equipped status on an item and adds relation values to the creature
 * @deprecated
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param tableId Integer
 * @param shouldBeEquipped Boolean
 * @param options Object
 * @param callback
 * @returns callback(err)
 */
function changeEquipped(user, creatureId, tableName, tableId, shouldBeEquipped, options, callback) {
    creatureId = parseInt(creatureId);
    tableId = parseInt(tableId);
    shouldBeEquipped = !!parseInt(shouldBeEquipped);
    options = options || {};

    let creature_has_table = 'creature_has_' + tableName,
        table_id = tableName + '_id',
        isAlreadyEquipped;

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('SELECT equipped FROM ' + creature_has_table + ' WHERE creature_id = ? AND ' + table_id + ' = ?', [creatureId, tableId], function(err, results) {
                if(err) return callback(err);

                isAlreadyEquipped = !!results[0].equipped;

                callback();
            });
        },
        function(callback) {
            if((isAlreadyEquipped && shouldBeEquipped) || (!isAlreadyEquipped && !shouldBeEquipped)) return callback();

            let addId = shouldBeEquipped ? tableId : null,
                subId = shouldBeEquipped ? null : tableId;

            value.updateMany(user, creatureId, tableName, addId, subId, options, callback)
        },
        function(callback) {
            if((isAlreadyEquipped && shouldBeEquipped) || (!isAlreadyEquipped && !shouldBeEquipped)) return callback();

            query('UPDATE ' + creature_has_table + ' SET equipped = ? WHERE creature_id = ? AND ' + table_id + ' = ?', [shouldBeEquipped, creatureId, tableId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

/** @deprecated See documentation for: {@link #changeEquipped} */
function equip(user, creatureId, tableName, tableId, options, callback) {
    changeEquipped(user, creatureId, tableName, tableId, true, options, callback);
}

/** @deprecated See documentation for: {@link #changeEquipped} */
function unequip(user, creatureId, tableName, tableId, options, callback) {
    changeEquipped(user, creatureId, tableName, tableId, false, options, callback);
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.equip = equip;
module.exports.unequip = unequip;
