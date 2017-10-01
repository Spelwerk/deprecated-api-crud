'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates a gift/imperfection in table
 *
 * @param user Object
 * @param tableName String
 * @param name String
 * @param description String
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports = function(user, tableName, name, description, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    var characteristicId;

    async.series([
        function(callback) {
            query('INSERT INTO ' + tableName + ' (user_id,name,description) VALUES (?,?,?)', [user.id, name, description], function(err, result) {
                if(err) return callback(err);

                characteristicId = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!manifestationId) return callback();

            query('INSERT INTO ' + tableName + '_is_manifestation (' + tableName + '_id,manifestation_id) VALUES (?,?)', [characteristicId, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO ' + tableName + '_is_species (' + tableName + '_id,species_id) VALUES (?,?)', [characteristicId, speciesId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_' + tableName + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)', [user.id, characteristicId], callback);
        }
    ], function(err) {
        callback(err, characteristicId);
    });
};

