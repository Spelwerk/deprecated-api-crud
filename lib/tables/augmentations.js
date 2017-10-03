'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates an augmentation in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param legal Boolean
 * @param price Integer
 * @param hackingDifficulty Integer
 * @param corporationId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, legal, price, hackingDifficulty, corporationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    legal = !!legal || false;
    price = parseInt(price) || 0;
    hackingDifficulty = parseInt(hackingDifficulty) || 0;
    corporationId = parseInt(corporationId) || null;

    var id;

    async.series([
        function(callback) {
            if(!corporationId) return callback();

            ownership(user, 'corporation', corporationId, callback);
        },

        function(callback) {
            query('INSERT INTO augmentation (user_id,name,description,legal,price,hacking_difficulty) VALUES (?,?,?,?,?,?)', [user.id, name, description, legal, price, hackingDifficulty], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!corporationId) return callback();

            query('INSERT INTO augmentation_is_corporation (augmentation_id,corporation_id) VALUES (?,?)', [id, corporationId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_augmentation (user_id,augmentation_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Updates augmentation with new values
 *
 * @param user Object
 * @param id Integer
 * @param name String
 * @param description String
 * @param legal Boolean
 * @param price Integer
 * @param hackingDifficulty Integer
 * @param corporationId Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, id, name, description, legal, price, hackingDifficulty, corporationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    id = parseInt(id);

    var update = {
        name: name || null,
        description: description || null,
        legal: !!legal || null,
        price: parseInt(price) || null,
        hacking_difficulty: parseInt(hackingDifficulty) || null
    };

    corporationId = parseInt(corporationId) || null;

    async.series([
        function(callback) {
            ownership(user, 'augmentation', id, callback);
        },
        function(callback) {
            if(!corporationId) return callback();

            ownership(user, 'corporation', corporationId, callback);
        },

        function(callback) {
            var sql = 'UPDATE augmentation SET ',
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
            if(!corporationId) return callback();

            query('INSERT INTO augmentation_is_corporation (augmentation_id,corporation_id) VALUES (?,?) ON DUPLICATE KEY UPDATE corporation_id = VALUES(corporation_id)', [id, corporationId], callback);
        }
    ], function(err) {
        callback(err);
    });
};
