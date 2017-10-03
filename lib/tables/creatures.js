'use strict';

var async = require('async'),
    query = require('../sql/query');

module.exports.post = function(user, name, description, worldId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    worldId = parseInt(worldId);
    speciesId = parseInt(speciesId);

    var id;

    var attributeArray = [],
        weaponArray = [];

    async.series([
        function(callback) {
            query('INSERT INTO creature (user_id,name,world_id) VALUES (?,?,?,?)', [user.id, name, worldId], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },
        function(callback) {
            if(!description) return callback();

            query('INSERT INTO creature_description (creature_id,description) VALUES (?,?)', [id, description], callback);
        },
        function(callback) {
            query('INSERT INTO creature_has_species (creature_id,species_id,first) VALUES (?,?,1)', [id, speciesId], callback);
        },

        function(callback) {
            var sql = 'SELECT ' +
                'attribute.id, ' +
                'world_has_attribute.value ' +
                'FROM world_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = world_has_attribute.attribute_id ' +
                'WHERE ' +
                'world_has_attribute.world_id = ?';

            query(sql, [worldId], function(err, results) {
                if(err) return callback(err);

                // Loop through results from world list and push the values into our new attribute array
                for(var i in results) {
                    var id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    attributeArray.push({id: id, value: value});
                }

                callback();
            });
        },
        function(callback) {
            query('SELECT attribute_id AS id, value FROM species_has_attribute WHERE species_id = ?', [speciesId], function(err, results) {
                if(err) return callback(err);

                // Loop through results array
                for(var i in results) {
                    var id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    // Then loop through attributes array and add species values together if the species attribute exists in the world list
                    for(var n in attributeArray) {
                        if(attributeArray[n].id === id) {
                            attributeArray[n].value += value;
                        }
                    }
                }

                callback();
            });
        },
        function(callback) {
            var sql = 'INSERT INTO creature_has_attribute (creature_id,attribute_id,value) VALUES ';

            // Create the query
            for(var x in attributeArray) {
                sql += '(' + id + ',' + attributeArray[x].id + ',' + attributeArray[x].value + '),';
            }

            sql = sql.slice(0, -1);

            query(sql, null, callback);
        },

        function(callback) {
            query('SELECT weapon_id AS id FROM weapon_is_species WHERE species_id = ?', [speciesId], function(err, results) {
                if(err) return callback(err);

                // Loop through results from world list and push the values into our new attribute array
                for(var i in results) {
                    var id = parseInt(results[i].id);

                    weaponArray.push({id: id});
                }

                callback();
            });
        },
        function(callback) {
            var sql = 'INSERT INTO creature_has_weapon (creature_id,weapon_id,value,equipped) VALUES ';

            // Create the query
            for(var i in weaponArray) {
                sql += '(' + id + ',' + weaponArray[i].id + ',1,1),';
            }

            sql = sql.slice(0, -1);

            query(sql, null, callback);
        },

        function(callback) {
            query('INSERT INTO user_has_creature (user_id,creature_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};
