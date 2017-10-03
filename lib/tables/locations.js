'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates a country in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param price Integer
 * @param countryId Integer
 * @param creatureId Integer
 * @param locationId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, price, countryId, creatureId, locationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    countryId = parseInt(countryId) || null;
    creatureId = parseInt(creatureId) || null;
    locationId = parseInt(locationId) || null;
    price = parseInt(price) || 0;

    var id;

    async.series([
        function(callback) {
            query('INSERT INTO location (user_id,name,description,price) VALUES (?,?,?,?)', [user.id, name, description, price], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!countryId) return callback();

            query('INSERT INTO location_is_country (location_id,country_id) VALUES (?,?)', [id, countryId], callback);
        },
        function(callback) {
            if(!creatureId) return callback();

            query('INSERT INTO location_is_creature (location_id,creature_id) VALUES (?,?)', [id, creatureId], callback);
        },
        function(callback) {
            if(!locationId) return callback();

            query('INSERT INTO location_is_location (location_id,recursive_id) VALUES (?,?)', [id, locationId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_country (user_id,location_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Updates a country with new values
 *
 * @param user Object
 * @param id Integer
 * @param name String
 * @param description String
 * @param price Integer
 * @param countryId Integer
 * @param creatureId Integer
 * @param locationId Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, id, name, description, price, countryId, creatureId, locationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    id = parseInt(id);

    var update = {
        name: name || null,
        description: description || null,
        price: price || null
    };

    countryId = parseInt(countryId) || null;
    creatureId = parseInt(creatureId) || null;
    locationId = parseInt(locationId) || null;

    async.series([
        function(callback) {
            ownership(user, 'location', id, callback);
        },

        function(callback) {
            var sql = 'UPDATE location SET ',
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
            if(!countryId) return callback();

            query('INSERT INTO location_is_country (location_id,country_id) VALUES (?,?) ON DUPLICATE KEY UPDATE country_id = VALUES(country_id)', [id, countryId], callback);
        },
        function(callback) {
            if(!creatureId) return callback();

            query('INSERT INTO location_is_creature (location_id,creature_id) VALUES (?,?) ON DUPLICATE KEY UPDATE creature_id = VALUES(creature_id)', [id, creatureId], callback);
        },
        function(callback) {
            if(!locationId) return callback();

            query('INSERT INTO location_is_location (location_id,recursive_id) VALUES (?,?) ON DUPLICATE KEY UPDATE recursive_id = VALUES(recursive_id)', [id, locationId], callback);
        }
    ], function(err) {
        callback(err);
    });
};
