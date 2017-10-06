'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates a corporation in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param locationId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, locationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    locationId = parseInt(locationId) || null;

    var id;

    async.series([
        function(callback) {
            query('INSERT INTO corporation (user_id,name,description) VALUES (?,?,?)', [user.id, name, description], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },
        function(callback) {
            if(!locationId) return callback();

            query('INSERT INTO corporation_is_location (corporation_id,location_id) VALUES (?,?)', [id, locationId], callback);
        },
        function(callback) {
            query('INSERT INTO user_has_country (user_id,corporation_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Updates a corporation with new values
 *
 * @param user Object
 * @param id Integer
 * @param name String
 * @param description String
 * @param locationId Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, id, name, description, locationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    id = parseInt(id);

    var update = {
        name: name || null,
        description: description || null
    };

    locationId = parseInt(locationId) || null;

    async.series([
        function(callback) {
            ownership(user, 'corporation', id, callback);
        },
        function(callback) {
            var sql = 'UPDATE corporation SET ',
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
        },
        function(callback) {
            if(!locationId) return callback();

            query('INSERT INTO corporation_is_location (corporation_id,location_id) VALUES (?,?) ON DUPLICATE KEY UPDATE location_id = VALUES(location_id)', [id, locationId], callback);
        }
    ], function(err) {
        callback(err);
    });
};
