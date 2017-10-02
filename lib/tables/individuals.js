'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates an individual in table based on creaatureId
 *
 * @param user Object
 * @param creatureId Integer
 * @param manifestation Boolean
 * @param age Integer
 * @param firstName String
 * @param lastName String
 * @param gender String
 * @param occupation String
 * @param callback
 * @returns callback(err)
 */

module.exports.post = function(user, creatureId, manifestation, age, firstName, lastName, gender, occupation, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    creatureId = parseInt(creatureId);
    manifestation = !!manifestation;
    age = parseInt(age);
    firstName = firstName || null;
    lastName = lastName || null;
    gender = gender || null;
    occupation = occupation || null;

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('INSERT INTO individual (creature_id,manifestation,age,firstname,lastname,gender,occupation) VALUES (?,?,?,?,?,?,?)',
                [creatureId, manifestation, age, firstName, lastName, gender, occupation], callback);
        }
    ], function(err) {
        callback(err);
    });
};
