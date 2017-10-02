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
