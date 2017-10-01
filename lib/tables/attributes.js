'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates an attribute in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param icon URL
 * @param typeId Integer
 * @param maximum Integer
 * @param callback
 * @returns callback(err, attributeId)
 */

module.exports = function(user, name, description, icon, typeId, maximum, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;

    var attributeId;

    async.series([
        function(callback) {
            query('INSERT INTO attribute (user_id,name,description,icon,attributetype_id,maximum) VALUES (?,?,?,?,?,?)', [user.id, name, description, icon, typeId, maximum], function(err, result) {
                if(err) return callback(err);

                attributeId = result.insertId;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO user_has_attribute (user_id,attribute_id,owner) VALUES (?,?,1)', [user.id, attributeId], callback);
        }
    ], function(err) {
        callback(err, attributeId);
    });
};

