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
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, typeId, legal, price, damageDice, damageBonus, criticalDice, criticalBonus, distance, augmentationId, speciesId, corporationId, callback) {
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

    var id;

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

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!augmentationId) return callback();

            query('INSERT INTO weapon_is_augmentation (weapon_id,augmentation_id) VALUES (?,?)', [id, augmentationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO weapon_is_species (weapon_id,species_id) VALUES (?,?)', [id, speciesId], callback);
        },
        function(callback) {
            if(!corporationId) return callback();

            query('INSERT INTO weapon_is_corporation (weapon_id,corporation_id) VALUES (?,?)', [id, corporationId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_weapon (user_id,weapon_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Updates a weapon with new values
 *
 * @param user Object
 * @param id Integer
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
 * @returns callback(err)
 */

module.exports.put = function(user, id, name, description, typeId, legal, price, damageDice, damageBonus, criticalDice, criticalBonus, distance, augmentationId, speciesId, corporationId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    var update = {
        name: name || null,
        description: description || null,
        weapontype_id: typeId || null,
        legal: legal || false,
        price: price || 0,
        damage_dice: damageDice || 0,
        damage_bonus: damageBonus || 0,
        critical_dice: criticalDice || 0,
        critical_bonus: criticalBonus || 0,
        distance: distance || 0
    };

    augmentationId = parseInt(augmentationId) || null;
    speciesId = parseInt(speciesId) || null;
    corporationId = parseInt(corporationId) || null;

    async.series([
        function(callback) {
            ownership(user, 'weapon', id, callback);
        },
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
            var sql = 'UPDATE weapon SET ',
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
            if(!augmentationId) return callback();

            query('INSERT INTO weapon_is_augmentation (weapon_id,augmentation_id) VALUES (?,?) ON DUPLICATE KEY UPDATE augmentation_id = VALUES(augmentation_id)', [id, augmentationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO weapon_is_species (weapon_id,species_id) VALUES (?,?) ON DUPLICATE KEY UPDATE species_id = VALUES(species_id)', [id, speciesId], callback);
        },
        function(callback) {
            if(!corporationId) return callback();

            query('INSERT INTO weapon_is_corporation (weapon_id,corporation_id) VALUES (?,?) ON DUPLICATE KEY UPDATE corporation_id = VALUES(corporation_id)', [id, corporationId], callback);
        }
    ], function(err) {
        callback(err);
    });
};
