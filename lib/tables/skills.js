'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates a skill in table
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

module.exports.post = function(user, name, description, icon, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    var skillId;

    async.series([
        function(callback) {
            if(!manifestationId) return callback();

            ownership(user, 'manifestation', manifestationId, callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            ownership(user, 'species', speciesId, callback);
        },

        function(callback) {
            query('INSERT INTO skill (user_id,name,description,icon) VALUES (?,?,?,?)', [user.id, name, description, icon], function(err, result) {
                if(err) return callback(err);

                skillId = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!manifestationId) return callback();

            query('INSERT INTO skill_is_manifestation (skill_id,manifestation_id) VALUES (?,?)', [skillId, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO skill_is_species (skill_id,species_id) VALUES (?,?)', [skillId, speciesId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_skill (user_id,skill_id,owner) VALUES (?,?,1)', [user.id, skillId], callback);
        }
    ], function(err) {
        callback(err, skillId);
    });
};
