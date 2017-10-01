'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates a weapon type in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param icon URL
 * @param attributeId Integer
 * @param expertiseId Integer
 * @param augmentation Boolean
 * @param species Boolean
 * @param callback
 * @returns callback(err, weaponTypeId)
 */

module.exports = function(user, name, description, icon, attributeId, expertiseId, augmentation, species, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    attributeId = parseInt(attributeId);
    expertiseId = parseInt(expertiseId);
    augmentation = !!augmentation;
    species = !!species;

    var weaponTypeId;

    async.series([
        function(callback) {
            query('INSERT INTO weapontype (user_id,name,description,icon,attribute_id,expertise_id,augmentation,species) VALUES (?,?,?,?,?,?,?,?)', [user.id, name, description, icon, attributeId, expertiseId, augmentation, species], function(err, result) {
                if(err) return callback(err);

                weaponTypeId = result.insertId;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO user_has_weapontype (user_id,weapontype_id,owner) VALUES (?,?,1)', [user.id, weaponTypeId], callback);
        }
    ], function(err) {
        callback(err, weaponTypeId);
    });
};

