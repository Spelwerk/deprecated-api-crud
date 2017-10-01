'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates a species in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param icon URL
 * @param playable Boolean
 * @param manifestation Boolean
 * @param maxAge Integer
 * @param multiplyDoctrine Integer
 * @param multiplyExpertise Integer
 * @param multiplySkill Integer
 * @param callback
 * @returns callback(err, speciesId)
 */

module.exports = function(user, name, description, icon, playable, manifestation, maxAge, multiplyDoctrine, multiplyExpertise, multiplySkill, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    playable = playable || null;
    manifestation = manifestation || null;
    maxAge = maxAge || null;
    multiplyDoctrine = multiplyDoctrine || null;
    multiplyExpertise = multiplyExpertise || null;
    multiplySkill = multiplySkill || null;

    var speciesId;

    async.series([
        function(callback) {
            query('INSERT INTO species (user_id,name,description,icon,playable,manifestation,max_age,multiply_doctrine,multiply_expertise,multiply_skill) VALUES (?,?,?,?,?,?,?,?,?,?)', [user.id, name, description, icon, playable, manifestation, maxAge, multiplyDoctrine, multiplyExpertise, multiplySkill], function(err, result) {
                if(err) return callback(err);

                speciesId = result.insertId;

                callback();
            });
        },

        function(callback) {
            query('INSERT INTO user_has_species (user_id,species_id,owner) VALUES (?,?,1)', [user.id, speciesId], callback);
        }
    ], function(err) {
        callback(err, speciesId);
    });
};

