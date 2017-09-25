'use strict';

var async = require('async');

var query = require('./../sql/query');

module.exports.post = function(req, callback) {
    if(!req.user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    var expertise = {},
        weapontype = {};

    expertise.name = req.body.name + ' Mastery';

    weapontype.name = req.body.name;
    weapontype.description = req.body.description || null;
    weapontype.icon = req.body.icon || null;

    weapontype.augmentation = req.body.augmentation_id || null;
    weapontype.damage = req.body.damage_id;
    weapontype.skill = req.body.skill_id;
    weapontype.species = req.body.species_id;

    async.series([

        // EXPERTISE

        function(callback) {
            query('INSERT INTO generic (user_id,name) VALUES (?,?)', [req.user.id, expertise.name], function(err, result) {
                if(err) return callback(err);

                expertise.id = result.insertId;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO expertise (generic_id,skill_id) VALUES (?,?)', [expertise.id, weapontype.skill], callback);
        },
        function(callback) {
            query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, expertise.id], callback);
        },

        // WEAPONTYPE

        function(callback) {
            query('INSERT INTO generic (user_id,name,description,icon) VALUES (?,?,?,?)', [req.user.id, weapontype.name, weapontype.description, weapontype.icon], function(err, result) {
                if(err) return callback(err);

                weapontype.id = result.insertId;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO weapontype (generic_id,skill_id,expertise_id,damage_id,augmentation_id,species_id) VALUES (?,?,?,?,?,?)', [weapontype.id, weapontype.skill, expertise.id, weapontype.damage, weapontype.augmentation, weapontype.species], callback);
        },
        function(callback) {
            query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, weapontype.id], callback);
        }
    ], function(err) {
        callback(err, weapontype.id);
    });
};