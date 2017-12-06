'use strict';

let AppError = require('../errors/app-error');

let async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

let value = require('./value'),
    weapon = require('./weapon');

/**
 * Adds an augmentation
 *
 * @param user
 * @param creatureId
 * @param bionicId
 * @param augmentationId
 * @param callback
 */
function add(user, creatureId, bionicId, augmentationId, callback) {
    creatureId = parseInt(creatureId);
    bionicId = parseInt(bionicId);
    augmentationId = parseInt(augmentationId);

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('SELECT bionic_id FROM creature_has_bionic WHERE creature_id = ? AND bionic_id = ?', [creatureId, bionicId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback(new AppError(400, "Request Error", "Bionic is not equipped on creature", "The bionic supplied in the request does not exist on the creature."));

                callback();
            });
        },
        function(callback) {
            query('SELECT augmentation_id FROM bionic_has_augmentation WHERE bionic_id = ? AND augmentation_id = ?', [bionicId, augmentationId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback(new AppError(400, "Request Error", "Augmentation not associated with bionic", "The specified augmentation is not associated with that bionic."));

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO creature_has_augmentation (creature_id,bionic_id,augmentation_id) VALUES (?,?,?)', [creatureId, bionicId, augmentationId], callback);
        },
        function(callback) {
            value.add(user, creatureId, 'augmentation', augmentationId, {ignoreArray: ['software']}, callback);
        },
        function(callback) {
            weapon.addCombination(user, creatureId, 'augmentation', augmentationId, callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Removes an augmentation
 *
 * @param user
 * @param creatureId
 * @param bionicId
 * @param augmentationId
 * @param callback
 */
function remove(user, creatureId, bionicId, augmentationId, callback) {
    creatureId = parseInt(creatureId);
    bionicId = parseInt(bionicId);
    augmentationId = parseInt(augmentationId);

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            value.subtract(user, creatureId, 'augmentation', augmentationId, {ignoreArray: ['software']}, callback);
        },
        function(callback) {
            weapon.removeCombination(user, creatureId, 'augmentation', augmentationId, callback);
        },
        function(callback) {
            query('DELETE FROM creature_has_augmentation WHERE creature_id = ? AND bionic_id = ? AND augmentation_id = ?', [creatureId, bionicId, augmentationId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.add = add;
module.exports.remove = remove;
