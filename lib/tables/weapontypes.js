'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

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
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, icon, attributeId, expertiseId, augmentation, species, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    attributeId = parseInt(attributeId);
    expertiseId = parseInt(expertiseId);
    augmentation = !!augmentation;
    species = !!species;

    var id;

    async.series([
        function(callback) {
            query('INSERT INTO weapontype (user_id,name,description,icon,attribute_id,expertise_id,augmentation,species) VALUES (?,?,?,?,?,?,?,?)', [user.id, name, description, icon, attributeId, expertiseId, augmentation, species], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO user_has_weapontype (user_id,weapontype_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Update weapon type with new values
 *
 * @param user Object
 * @param id Integer
 * @param name String
 * @param description String
 * @param icon URL
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, id, name, description, icon, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    id = parseInt(id);

    var update = {
        name: name || null,
        description: description || null,
        icon: icon || null
    };

    async.series([
        function(callback) {
            ownership(user, 'weapontype', id, callback);
        },

        function(callback) {
            var sql = 'UPDATE weapontype SET ',
                values = [];

            for(var i in update) {
                if(update.hasOwnProperty(i)) {
                    sql += i + ' = ?,';
                    values.push(update[i]);
                }
            }

            if(values.length === 0) return callback();

            sql += 'updated = CURRENT_TIMESTAMP,';

            sql = sql.slice(0, -1) + ' WHERE id = ?';
            values.push(id);

            query(sql, values, callback);
        }
    ], function(err) {
        callback(err);
    });
};
