'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates a background in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param icon URL
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports = function(user, name, description, icon, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    var backgroundId;

    async.series([
        function(callback) {
            query('INSERT INTO background (user_id,name,description,icon) VALUES (?,?,?,?)', [user.id, name, description, icon], function(err, result) {
                if(err) return callback(err);

                backgroundId = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!manifestationId) return callback();

            query('INSERT INTO background_is_manifestation (background_id,manifestation_id) VALUES (?,?)', [backgroundId, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO background_is_species (background_id,species_id) VALUES (?,?)', [backgroundId, speciesId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_background (user_id,background_id,owner) VALUES (?,?,1)', [user.id, backgroundId], callback);
        }
    ], function(err) {
        callback(err, backgroundId);
    });
};

