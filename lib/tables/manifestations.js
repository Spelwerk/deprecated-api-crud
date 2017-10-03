'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates a manifestation in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param icon URL
 * @param attributeId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, icon, attributeId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;

    var id;

    async.series([
        function(callback) {
            ownership(user, 'attribute', attributeId, callback);
        },

        function(callback) {
            query('INSERT INTO manifestation (user_id,name,description,icon,attribute_id) VALUES (?,?,?,?,?)', [user.id, name, description, icon, attributeId], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            query('INSERT INTO user_has_manifestation (user_id,manifestation_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

module.exports.put = function(user, id, name, description, icon, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

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
            var sql = 'UPDATE manifestation SET ',
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
