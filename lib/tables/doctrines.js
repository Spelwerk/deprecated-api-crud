'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates a doctrine in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param icon URL
 * @param expertiseId Integer
 * @param manifestationId Integer
 * @param effects String
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, icon, expertiseId, manifestationId, effects, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    icon = icon || null;
    expertiseId = parseInt(expertiseId);
    manifestationId = parseInt(manifestationId);
    effects = effects || null;

    var id;

    async.series([
        function(callback) {
            if(!expertiseId) return callback();

            ownership(user, 'expertise', expertiseId, callback);
        },
        function(callback) {
            if(!manifestationId) return callback();

            ownership(user, 'manifestation', manifestationId, callback);
        },

        function(callback) {
            query('INSERT INTO doctrine (user_id,name,description,icon,expertise_id,manifestation_id,effects) VALUES (?,?,?,?,?,?,?)', [user.id, name, description, icon, expertiseId, manifestationId, effects], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            query('INSERT INTO user_has_doctrine (user_id,doctrine_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Updates a doctrine with new values
 *
 * @param user Object
 * @param id Integer
 * @param name String
 * @param description String
 * @param icon URL
 * @param effects String
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, id, name, description, icon, effects, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    var update = {
        name: name || null,
        description: description || null,
        icon: icon || null,
        effects: effects || null
    };

    async.series([
        function(callback) {
            ownership(user, 'doctrine', id, callback);
        },

        function(callback) {
            var sql = 'UPDATE doctrine SET ',
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
        }
    ], function(err) {
        callback(err);
    });
};
