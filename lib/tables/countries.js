'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates a country in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param languageId Integer
 * @param nickNameGroupId Integer
 * @param firstNameGroupId Integer
 * @param lastNameGroupId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, languageId, nickNameGroupId, firstNameGroupId, lastNameGroupId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    languageId = parseInt(languageId) || null;
    nickNameGroupId = parseInt(nickNameGroupId) || null;
    firstNameGroupId = parseInt(firstNameGroupId) || null;
    lastNameGroupId = parseInt(lastNameGroupId) || null;

    var id;

    async.series([
        function(callback) {
            query('INSERT INTO country (user_id,name,description) VALUES (?,?,?)', [user.id, name, description], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!languageId) return callback();

            query('INSERT INTO country_is_language (country_id,language_id) VALUES (?,?)', [id, languageId], callback);
        },
        function(callback) {
            if(!nickNameGroupId) return callback();

            query('INSERT INTO country_is_nicknamegroup (country_id,nicknamegroup_id) VALUES (?,?)', [id, nickNameGroupId], callback);
        },
        function(callback) {
            if(!firstNameGroupId) return callback();

            query('INSERT INTO country_is_firstnamegroup (country_id,firstnamegroup_id) VALUES (?,?)', [id, firstNameGroupId], callback);
        },
        function(callback) {
            if(!lastNameGroupId) return callback();

            query('INSERT INTO country_is_lastnamegroup (country_id,lastnamegroup_id) VALUES (?,?)', [id, lastNameGroupId], callback);
        },
        
        function(callback) {
            query('INSERT INTO user_has_country (user_id,country_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};
