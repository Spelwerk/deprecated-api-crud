'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates a country in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param price Integer
 * @param countryId Integer
 * @param individualId Integer
 * @param locationId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, price, countryId, individualId, locationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    countryId = parseInt(countryId) || null;
    individualId = parseInt(individualId) || null;
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
            if(!individualId) return callback();

            query('INSERT INTO location_is_individual (location_id,individual_id) VALUES (?,?)', [id, individualId], callback);
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
