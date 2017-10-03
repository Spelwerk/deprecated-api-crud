'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates a skill in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param icon URL
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, icon, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    var id;

    async.series([
        function(callback) {
            if(!manifestationId) return callback();

            ownership(user, 'manifestation', manifestationId, callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            ownership(user, 'species', speciesId, callback);
        },

        function(callback) {
            query('INSERT INTO skill (user_id,name,description,icon) VALUES (?,?,?,?)', [user.id, name, description, icon], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!manifestationId) return callback();

            query('INSERT INTO skill_is_manifestation (skill_id,manifestation_id) VALUES (?,?)', [id, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO skill_is_species (skill_id,species_id) VALUES (?,?)', [id, speciesId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_skill (user_id,skill_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Updates a skill with new values
 *
 * @param user Object
 * @param id Integer
 * @param name String
 * @param description String
 * @param icon URL
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, id, name, description, icon, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    id = parseInt(id);

    var update = {
        name: name || null,
        description: description || null,
        icon: icon || null
    };

    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    async.series([
        function(callback) {
            ownership(user, 'skill', id, callback);
        },
        function(callback) {
            if(!manifestationId) return callback();

            ownership(user, 'manifestation', manifestationId, callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            ownership(user, 'species', speciesId, callback);
        },

        function(callback) {
            var sql = 'UPDATE skill SET ',
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
            if(!manifestationId) return callback();

            query('INSERT INTO skill_is_manifestation (skill_id,manifestation_id) VALUES (?,?) ON DUPLICATE KEY UPDATE manifestation_id = VALUES(manifestation_id)', [id, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO skill_is_species (skill_id,species_id) VALUES (?,?) ON DUPLICATE KEY UPDATE species_id = VALUES(species_id)', [id, speciesId], callback);
        }
    ], function(err) {
        callback(err);
    });
};
