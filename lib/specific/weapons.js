'use strict';

var async = require('async');

var query = require('./../sql/query');

var weapontypes = require('./weapontypes');

module.exports.post = function(req, callback) {
    if(!req.user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    var weapon = {};

    weapon.name = req.body.name;
    weapon.description = req.body.name;
    weapon.augmentation = req.body.augmentation_id || null;
    weapon.weapontype = req.body.weapontype_id || false;
    weapon.legal = req.body.legal || 0;
    weapon.price = req.body.price || 0;
    weapon.damage_dice = req.body.damage_dice || 0;
    weapon.damage_bonus = req.body.damage_bonus || 0;
    weapon.critical_dice = req.body.critical_dice || 0;
    weapon.critical_bonus = req.body.critical_bonus || 0;
    weapon.hand = req.body.hand || 0;
    weapon.distance = req.body.distance || 0;

    async.series([

        // WEAPONTYPE

        function(callback) {
            if(weapon.weapontype) return callback();

            weapontypes.post(req, function(err, id) {
                if(err) return callback(err);

                weapon.weapontype = id;
            });
        },

        // WEAPON

        function(callback) {
            query('INSERT INTO generic (user_id,name,description) VALUES (?,?,?)', [req.user.id, weapon.name, weapon.description], function(err, result) {
                if(err) return callback(err);

                weapon.id = result.insertId;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO weapon (generic_id,weapontype_id,augmentation_id,legal,price,damage_dice,damage_bonus,critical_dice,critical_bonus,hand,distance) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [weapon.id, weapon.weapontype, weapon.augmentation, weapon.legal, weapon.price, weapon.damage_dice, weapon.damage_bonus, weapon.critical_dice, weapon.critical_bonus, weapon.hand, weapon.distance], callback);
        },
        function(callback) {
            query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, weapon.id], callback);
        }
    ], function(err) {
        callback(err, weapon.id);
    });
};