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

module.exports.post = function(user, name, description, icon, manifestationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    manifestationId = parseInt(manifestationId);

    var id;

    async.series([
        function(callback) {
            ownership(user, 'manifestation', manifestationId, callback);
        },

        function(callback) {
            query('INSERT INTO focus (user_id,name,description,icon,manifestation_id) VALUES (?,?,?,?,?)', [user.id, name, description, icon, manifestationId], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            query('INSERT INTO user_has_focus (user_id,focus_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Updates a focus with new values
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
            ownership(user, 'manifestation', id, callback);
        },

        function(callback) {
            var sql = 'UPDATE focus SET ',
                values = [];

            for(var i in update) {
                if(update[i] !== null && update.hasOwnProperty(i)) {
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
