'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates a milestone in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param backgroundId Integer
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, backgroundId, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    backgroundId = parseInt(backgroundId) || null;
    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    var id;

    async.series([
        function(callback) {
            query('INSERT INTO milestone (user_id,name,description) VALUES (?,?,?)', [user.id, name, description], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!backgroundId) return callback();

            query('INSERT INTO milestone_is_background (milestone_id,background_id) VALUES (?,?)', [id, backgroundId], callback);
        },
        function(callback) {
            if(!manifestationId) return callback();

            query('INSERT INTO milestone_is_manifestation (milestone_id,manifestation_id) VALUES (?,?)', [id, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO milestone_is_species (milestone_id,species_id) VALUES (?,?)', [id, speciesId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_milestone (user_id,milestone_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};
