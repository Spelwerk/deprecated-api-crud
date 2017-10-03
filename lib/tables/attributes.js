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
 * @param avatar Boolean : Default attribute that will be added to all new avatars during creation
 * @param creature Boolean : Default attribute that will be added to all creatures during creation
 * @param optional Boolean : Default attribute that will be added to all new worlds during creation
 * @param minimum Integer : Minimum value of attribute when used by creatures. Also applied to world.
 * @param maximum Integer : Maximum value of attribute when used by creatures
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, icon, typeId, optional, minimum, maximum, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    typeId = parseInt(typeId);
    optional = !!optional;
    minimum = parseInt(minimum);
    maximum = parseInt(maximum);

    var id;

    async.series([
        function(callback) {
            query('INSERT INTO attribute (user_id,name,description,icon,attributetype_id,optional,minimum,maximum) VALUES (?,?,?,?,?,?,?,?)', [user.id, name, description, icon, typeId, optional, minimum, maximum], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO user_has_attribute (user_id,attribute_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};
