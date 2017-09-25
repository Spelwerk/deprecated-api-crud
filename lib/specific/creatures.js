'use strict';

var async = require('async');

var query = require('./../sql/query');

module.exports.post = function(req, callback) {
    if(!req.user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    var creature = {};

    creature.name = req.body.name;
    creature.description = req.body.description || null;
    creature.world = req.body.world_id;
    creature.species = req.body.species_id;

    async.series([

        // CREATURE

        function(callback) {
            query('INSERT INTO generic (user_id,name,description) VALUES (?,?,?)', [req.user.id, creature.name, creature.description], function(err, result) {
                if(err) return callback(err);

                creature.id = result.insertId;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO creature (generic_id,world_id,calculated) VALUES (?,?,?)', [creature.id, creature.world, 0], callback);
        },
        function(callback) {
            query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, creature.id], callback);
        },

        // SPECIES

        function(callback) {
            query('INSERT INTO creature_has_species (creature_id,species_id,dominant) VALUES (?,?,?)', [creature.id, creature.species, 1], callback);
        },

        // WEAPONS

        function(callback) {
            query('SELECT weapon.generic_id AS id FROM weapon LEFT JOIN weapontype ON weapontype.generic_id = weapon.weapontype_id WHERE weapontype.species_id = ?', [creature.species], function(err, results) {
                if(err) return callback(err);

                creature.weapons = results;

                callback();
            });
        },
        function(callback) {
            var call = 'INSERT INTO creature_has_weapon (creature_id,weapon_id,value,equipped) VALUES ';

            for(var i in creature.weapons) {
                call += '(' + creature.id + ',' + creature.weapons[i].id + ',1,1),';
            }

            call = call.slice(0, -1);

            query(call, null, callback);
        }

    ], function(err) {
        callback(err, creature.id);
    });
};