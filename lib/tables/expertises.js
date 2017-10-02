'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates an expertise in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param skillId Integer
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, skillId, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    skillId = parseInt(skillId);
    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    var expertiseId;

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
            query('INSERT INTO expertise (user_id,name,description,skill_id) VALUES (?,?,?,?)', [user.id, name, description, skillId], function(err, result) {
                if(err) return callback(err);

                expertiseId = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!manifestationId) return callback();

            query('INSERT INTO expertise_is_manifestation (expertise_id,manifestation_id) VALUES (?,?)', [expertiseId, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO expertise_is_species (expertise_id,species_id) VALUES (?,?)', [expertiseId, speciesId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_expertise (user_id,expertise_id,owner) VALUES (?,?,1)', [user.id, expertiseId], callback);
        }
    ], function(err) {
        callback(err, expertiseId);
    });
};
