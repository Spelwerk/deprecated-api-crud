'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates a gift/imperfection in table
 *
 * @param user Object
 * @param tableName String
 * @param name String
 * @param description String
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, tableName, name, description, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    var id;

    async.series([
        function(callback) {
            query('INSERT INTO ' + tableName + ' (user_id,name,description) VALUES (?,?,?)', [user.id, name, description], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!manifestationId) return callback();

            query('INSERT INTO ' + tableName + '_is_manifestation (' + tableName + '_id,manifestation_id) VALUES (?,?)', [id, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO ' + tableName + '_is_species (' + tableName + '_id,species_id) VALUES (?,?)', [id, speciesId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_' + tableName + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Updates a gift/imperfection with new values
 *
 * @param user Object
 * @param tableName String
 * @param id Integer
 * @param name String
 * @param description String
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, tableName, id, name, description, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    var update = {
        name: name || null,
        description: description || null
    };

    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    async.series([
        function(callback) {
            ownership(user, tableName, id, callback);
        },

        function(callback) {
            var sql = 'UPDATE ' + tableName + ' SET ',
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
            if(!manifestationId) return callback();

            query('INSERT INTO ' + tableName + '_is_manifestation (' + tableName + '_id,manifestation_id) VALUES (?,?) ON DUPLICATE KEY UPDATE manifestation_id = VALUES(manifestation_id)', [id, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO ' + tableName + '_is_species (' + tableName + '_id,species_id) VALUES (?,?) ON DUPLICATE KEY UPDATE species_id = VALUES(species_id)', [id, speciesId], callback);
        }
    ], function(err) {
        callback(err);
    });
};
