'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates a focus for a manifestation
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param icon URL
 * @param manifestationId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports = function(user, name, description, icon, manifestationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    manifestationId = parseInt(manifestationId);

    var focusId;

    async.series([
        function(callback) {
            ownership(user, 'manifestation', manifestationId, callback);
        },

        function(callback) {
            query('INSERT INTO focus (user_id,name,description,icon,manifestation_id) VALUES (?,?,?,?,?)', [user.id, name, description, icon, manifestationId], function(err, result) {
                if(err) return callback(err);

                focusId = result.insertId;

                callback();
            });
        },

        function(callback) {
            query('INSERT INTO user_has_focus (user_id,focus_id,owner) VALUES (?,?,1)', [user.id, focusId], callback);
        }
    ], function(err) {
        callback(err, focusId);
    });
};

