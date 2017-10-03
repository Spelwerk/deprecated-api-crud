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

/**
 * Updates a country with new values
 *
 * @param user Object
 * @param id Integer
 * @param name String
 * @param description String
 * @param languageId Integer
 * @param nickNameGroupId Integer
 * @param firstNameGroupId Integer
 * @param lastNameGroupId Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, id, name, description, languageId, nickNameGroupId, firstNameGroupId, lastNameGroupId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    var update = {
        name: name || null,
        description: description || null
    };

    languageId = parseInt(languageId) || null;
    nickNameGroupId = parseInt(nickNameGroupId) || null;
    firstNameGroupId = parseInt(firstNameGroupId) || null;
    lastNameGroupId = parseInt(lastNameGroupId) || null;

    async.series([
        function(callback) {
            ownership(user, 'country', id, callback);
        },

        function(callback) {
            var sql = 'UPDATE country SET ',
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
        },

        function(callback) {
            if(!languageId) return callback();

            query('INSERT INTO country_is_language (country_id,language_id) VALUES (?,?) ON DUPLICATE KEY UPDATE language_id = VALUES(language_id)', [id, languageId], callback);
        },
        function(callback) {
            if(!nickNameGroupId) return callback();

            query('INSERT INTO country_is_nicknamegroup (country_id,nicknamegroup_id) VALUES (?,?) ON DUPLICATE KEY UPDATE nicknamegroup_id = VALUES(nicknamegroup_id)', [id, nickNameGroupId], callback);
        },
        function(callback) {
            if(!firstNameGroupId) return callback();

            query('INSERT INTO country_is_firstnamegroup (country_id,firstnamegroup_id) VALUES (?,?) ON DUPLICATE KEY UPDATE firstnamegroup_id = VALUES(firstnamegroup_id)', [id, firstNameGroupId], callback);
        },
        function(callback) {
            if(!lastNameGroupId) return callback();

            query('INSERT INTO country_is_lastnamegroup (country_id,lastnamegroup_id) VALUES (?,?) ON DUPLICATE KEY UPDATE lastnamegroup_id = VALUES(lastnamegroup_id)', [id, lastNameGroupId], callback);
        }
    ], function(err) {
        callback(err);
    });
};