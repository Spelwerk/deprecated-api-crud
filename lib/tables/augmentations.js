'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

module.exports = function(user, name, description, legal, price, hackingDifficulty, corporationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    legal = !!legal || false;
    price = parseInt(price) || 0;
    hackingDifficulty = parseInt(hackingDifficulty) || 0;
    corporationId = parseInt(corporationId) || null;

    var augmentationId;

    async.series([
        function(callback) {
            if(!corporationId) return callback();

            ownership(user, 'corporation', corporationId, callback);
        },

        function(callback) {
            query('INSERT INTO augmentation (user_id,name,description,legal,price,hacking_difficulty) VALUES (?,?,?,?,?,?)', [user.id, name, description, legal, price, hackingDifficulty], function(err, result) {
                if(err) return callback(err);

                augmentationId = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!corporationId) return callback();

            query('INSERT INTO augmentation_is_corporation (augmentation_id,corporation_id) VALUES (?,?)', [augmentationId, corporationId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_augmentation (user_id,augmentation_id,owner) VALUES (?,?,1)', [user.id, augmentationId], callback);
        }
    ], function(err) {
        callback(err, augmentationId);
    });
};