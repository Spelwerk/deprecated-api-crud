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
 * @param optional Boolean : Default attribute that will be added to all new worlds in creation
 * @param maximum Integer : Maximum value of attribute when used by creatures
 * @param value Integer : Default value of attribute when added to world
 * @param callback
 * @returns callback(err, id)
 */

module.exports = function(user, name, description, icon, typeId, optional, maximum, value, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    typeId = parseInt(typeId);
    optional = !!optional;
    maximum = parseInt(maximum);
    value = parseInt(value);

    var attributeId;

    async.series([
        function(callback) {
            query('INSERT INTO attribute (user_id,name,description,icon,attributetype_id,optional,maximum,value) VALUES (?,?,?,?,?,?,?,?)', [user.id, name, description, icon, typeId, optional, maximum, value], function(err, result) {
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

