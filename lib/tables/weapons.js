'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates a weapon in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param typeId Integer
 * @param legal Boolean
 * @param price Integer
 * @param damageDice Integer
 * @param damageBonus Integer
 * @param criticalDice Integer
 * @param criticalBonus Integer
 * @param distance Integer
 * @param augmentationId Integer
 * @param speciesId Integer
 * @param corporationId Integer
 * @param callback
 * @returns callback(err, weaponId)
 */

module.exports = function(user, name, description, typeId, legal, price, damageDice, damageBonus, criticalDice, criticalBonus, distance, augmentationId, speciesId, corporationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    typeId = parseInt(typeId);
    legal = legal || false;
    price = price || 0;
    damageDice = damageDice || 0;
    damageBonus = damageBonus || 0;
    criticalDice = criticalDice || 0;
    criticalBonus = criticalBonus || 0;
    distance = distance || 0;
    augmentationId = parseInt(augmentationId) || null;
    speciesId = parseInt(speciesId) || null;
    corporationId = parseInt(corporationId) || null;

    var weaponId;

    async.series([
        function(callback) {
            if(!augmentationId) return callback();

            ownership(user, 'augmentation', augmentationId, callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            ownership(user, 'species', speciesId, callback);
        },
        function(callback) {
            if(!corporationId) return callback();

            ownership(user, 'corporation', corporationId, callback);
        },

        function(callback) {
            query('INSERT INTO weapon (user_id,name,description,weapontype_id,legal,price,damage_dice,damage_bonus,critical_dice,critical_bonus,distance) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [user.id, name, description, typeId, legal, price, damageDice, damageBonus, criticalDice, criticalBonus, distance], function(err, result) {
                if(err) return callback(err);

                weaponId = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!augmentationId) return callback();

            query('INSERT INTO weapon_is_augmentation (weapon_id,augmentation_id) VALUES (?,?)', [weaponId, augmentationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO weapon_is_species (weapon_id,species_id) VALUES (?,?)', [weaponId, speciesId], callback);
        },
        function(callback) {
            if(!corporationId) return callback();

            query('INSERT INTO weapon_is_corporation (weapon_id,corporation_id) VALUES (?,?)', [weaponId, corporationId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_weapon (user_id,weapon_id,owner) VALUES (?,?,1)', [user.id, weaponId], callback);
        }
    ], function(err) {
        callback(err, weaponId);
    });
};

