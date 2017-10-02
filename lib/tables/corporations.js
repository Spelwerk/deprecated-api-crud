'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates a corporation in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param locationId Integer
 * @param countryId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, countryId, locationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    countryId = parseInt(countryId) || null;
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
            if(!countryId) return callback();

            query('INSERT INTO corporation_is_country (corporation_id,country_id) VALUES (?,?)', [id, countryId], callback);
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
