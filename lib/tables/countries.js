'use strict';

var async = require('async'),
    query = require('../sql/query');

module.exports = function(user, name, description, languageId, nickNameGroupId, firstNameGroupId, lastNameGroupId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    languageId = parseInt(languageId) || null;
    nickNameGroupId = parseInt(nickNameGroupId) || null;
    firstNameGroupId = parseInt(firstNameGroupId) || null;
    lastNameGroupId = parseInt(lastNameGroupId) || null;

    var countryId;

    async.series([
        function(callback) {
            query('INSERT INTO country (user_id,name,description) VALUES (?,?,?)', [user.id, name, description], function(err, result) {
                if(err) return callback(err);

                countryId = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!languageId) return callback();

            query('INSERT INTO country_is_language (country_id,language_id) VALUES (?,?)', [countryId, languageId], callback);
        },
        function(callback) {
            if(!nickNameGroupId) return callback();

            query('INSERT INTO country_is_nicknamegroup (country_id,nicknamegroup_id) VALUES (?,?)', [countryId, nickNameGroupId], callback);
        },
        function(callback) {
            if(!firstNameGroupId) return callback();

            query('INSERT INTO country_is_firstnamegroup (country_id,firstnamegroup_id) VALUES (?,?)', [countryId, firstNameGroupId], callback);
        },
        function(callback) {
            if(!lastNameGroupId) return callback();

            query('INSERT INTO country_is_lastnamegroup (country_id,lastnamegroup_id) VALUES (?,?)', [countryId, lastNameGroupId], callback);
        },
        
        function(callback) {
            query('INSERT INTO user_has_country (user_id,country_id,owner) VALUES (?,?,1)', [user.id, countryId], callback);
        }
    ], function(err) {
        callback(err, countryId);
    });
};

