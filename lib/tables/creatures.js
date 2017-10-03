'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

function relationTable(id, relation, text, callback) {
    if(!text) return callback();

    query('INSERT INTO creature_' + relation + ' (creature_id,' + relation + ') VALUES (?,?) ON DUPLICATE KEY UPDATE ' + relation + ' = VALUES(' + relation + ')', [id, text], callback);
}

function connectionTable(id, connection, connectionId, callback) {
    if(!connectionId) return callback();

    query('INSERT INTO creature_is_' + connection + ' (creature_id,' + connection + '_id) VALUES (?,?) ON DUPLICATE KEY UPDATE ' + connection + '_id = VALUES(' + connection + '_id)', [id, connectionId], callback);
}

/**
 * Selects relation values from creature and a table and adds them together. Subtracts if there is a change.
 *
 * @param user Object
 * @param id Integer
 * @param tableName String
 * @param relationName String
 * @param additionId Integer
 * @param subtractionId Integer
 * @param callback
 * @returns callback(err)
 */

function relationValues(user, id, tableName, relationName, additionId, subtractionId, callback) {
    var creature_has_relation = 'creature_has_' + relationName,
        table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id';

    var array = [],
        arrayAdd = [],
        arraySubtract = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', id, callback);
        },

        // Getting the values
        function(callback) {
            if(!additionId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + creature_has_relation + ' WHERE creature_id = ?', [id], function(err, results) {
                if(err) return callback(err);

                for(var i in results) {
                    var id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    array.push({id: id, value: value});
                }

                callback();
            });
        },
        function(callback) {
            if(!additionId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ?', [additionId], function(err, results) {
                if(err) return callback(err);

                for(var i in results) {
                    var id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    arrayAdd.push({id: id, value: value});
                }

                callback();
            });
        },
        function(callback) {
            if(!subtractionId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ?', [subtractionId], function(err, results) {
                if(err) return callback(err);

                for(var i in results) {
                    var id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    arraySubtract.push({id: id, value: value});
                }

                callback();
            });
        },

        // Setting the values
        function(callback) {
            if(!additionId) return callback();

            var sql = 'INSERT INTO ' + creature_has_relation + ' (creature_id,' + relation_id + ',value) VALUES ',
                changed = false;

            // Loop through current attributes list
            for(var i in array) {
                array[i].changed = false;

                // Loop through attributes in new wealth
                if(arrayAdd.length !== 0) {
                    for(var x in arrayAdd) {

                        // If IDs are matched, add to attributes list
                        if(array[i].id === arrayAdd[x].id) {
                            array[i].value = parseInt(array[i].value) + parseInt(arrayAdd[x].value);
                            array[i].changed = true;
                            changed = true;
                        }
                    }
                }

                // Loop through attributes in current wealth
                if(arraySubtract.length !== 0) {
                    for(var k in arraySubtract) {

                        // If IDs are matched, subtract from attributes list
                        if(array[i].id === arraySubtract[k].id) {
                            array[i].value = parseInt(array[i].value) - parseInt(arraySubtract[k].value);
                            array[i].changed = true;
                            changed = true;
                        }
                    }
                }

                if(array[i].changed === true) {
                    sql += '(' + id + ',' + array[i].id + ',' + array[i].value + '),';
                }
            }

            if(!changed) return callback();

            sql = sql.slice(0, -1) + ' ON DUPLICATE KEY UPDATE value = VALUES(value)';

            console.log(sql);

            query(sql, null, callback);
        }
    ], function(err) {
        callback(err);
    });
}
module.exports.relationValues = relationValues;

/**
 * Creates a creature in table
 *
 * @param user Object
 * @param firstName String
 * @param nickName String
 * @param middleName String
 * @param lastName String
 * @param description String
 * @param worldId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, firstName, nickName, middleName, lastName, worldId, speciesId, description, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    nickName = nickName || null;
    middleName = middleName || null;
    lastName = lastName || null;
    worldId = parseInt(worldId);
    speciesId = parseInt(speciesId);
    description = description || null;

    var id;

    var attributeArray = [],
        weaponArray = [];

    async.series([
        function(callback) {
            query('INSERT INTO creature (user_id,firstname,nickname,middlename,lastname,world_id) VALUES (?,?,?,?,?,?)', [user.id, firstName, nickName, middleName, lastName, worldId], function(err, result) {
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

/**
 * Updates a creature with new values
 *
 * @param user Object
 * @param id Integer
 * @param firstName String
 * @param nickName String
 * @param middleName String
 * @param lastName String
 * @param calculated Boolean
 * @param manifestation Boolean
 * @param appearance String
 * @param age Integer
 * @param biography String
 * @param description String
 * @param drive String
 * @param gender String
 * @param occupation String
 * @param personality String
 * @param pride String
 * @param problem String
 * @param shame String
 * @param pointDoctrine Integer
 * @param pointExpertise Integer
 * @param pointGift Integer
 * @param pointImperfection Integer
 * @param pointMilestone Integer
 * @param pointSkill Integer
 * @param corporationId Integer
 * @param countryId Integer
 * @param identityId Integer
 * @param natureId Integer
 * @param wealthId Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, id, firstName, nickName, middleName, lastName, calculated, manifestation, appearance, age, biography, description, drive, gender, occupation, personality, pride, problem, shame, pointDoctrine, pointExpertise, pointGift, pointImperfection, pointMilestone, pointSkill, corporationId, countryId, identityId, natureId, wealthId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    id = parseInt(id);

    var update = {
        firstname: firstName || null,
        nickname: nickName || null,
        middlename: middleName || null,
        lastname: lastName || null,
        calculated: calculated || null,
        manifestation: manifestation || null
    };

    var points = {
        point_doctrine: pointDoctrine || null,
        point_expertise: pointExpertise || null,
        point_gift: pointGift || null,
        point_imperfection: pointImperfection || null,
        point_milestone: pointMilestone || null,
        point_skill: pointSkill || null
    };

    appearance = appearance || null;
    age = parseInt(age) || null;
    biography = biography || null;
    description = description || null;
    drive = drive || null;
    gender = gender || null;
    occupation = occupation || null;
    personality = personality || null;
    pride = pride || null;
    problem = problem || null;
    shame = shame || null;

    corporationId = parseInt(corporationId) || null;
    countryId = parseInt(countryId) || null;
    identityId = parseInt(identityId) || null;
    natureId = parseInt(natureId) || null;
    wealthId = parseInt(wealthId) || null;

    var attributes = [],
        currentWealth = null,
        currentWealthAttributes = [],
        wealthAttributes = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', id, callback);
        },

        function(callback) {
            var sql = 'UPDATE creature SET ',
                values = [];

            for(var i in update) {
                if(update[i] !== null && update.hasOwnProperty(i)) {
                    sql += i + ' = ?, ';
                    values.push(update[i]);
                }
            }

            sql += 'updated = CURRENT_TIMESTAMP,';

            sql = sql.slice(0, -1) + ' WHERE id = ?';
            values.push(id);

            query(sql, values, callback);
        },

        function(callback) {
            var insert = 'INSERT INTO creature_points (creature_id,',
                duplicate = ' ON DUPLICATE KEY UPDATE ',
                values = ' VALUES (' + id + ',',
                changed = false;

            for(var i in points) {
                if(points[i] !== null && points.hasOwnProperty(i)) {
                    changed = true;
                    insert += i + ',';
                    values += points[i] + ',';
                    duplicate += i + ' = ' + points[i] + ', ';
                }
            }

            if(!changed) return callback();

            insert = insert.slice(0, -1) + ')';
            values = values.slice(0, -1) + ')';
            duplicate = duplicate.slice(0, -2);

            var sql = insert + values + duplicate;

            query(sql, null, callback);
        },

        function(callback) {
            relationTable(id, 'appearance', appearance, callback);
        },
        function(callback) {
            relationTable(id, 'age', age, callback);
        },
        function(callback) {
            relationTable(id, 'biography', biography, callback);
        },
        function(callback) {
            relationTable(id, 'description', description, callback);
        },
        function(callback) {
            relationTable(id, 'drive', drive, callback);
        },
        function(callback) {
            relationTable(id, 'gender', gender, callback);
        },
        function(callback) {
            relationTable(id, 'occupation', occupation, callback);
        },
        function(callback) {
            relationTable(id, 'personality', personality, callback);
        },
        function(callback) {
            relationTable(id, 'pride', pride, callback);
        },
        function(callback) {
            relationTable(id, 'problem', problem, callback);
        },
        function(callback) {
            relationTable(id, 'shame', shame, callback);
        },

        function(callback) {
            connectionTable(id, 'corporation', corporationId, callback);
        },
        function(callback) {
            connectionTable(id, 'country', countryId, callback);
        },
        function(callback) {
            connectionTable(id, 'identity', identityId, callback);
        },
        function(callback) {
            connectionTable(id, 'nature', natureId, callback);
        },

        function(callback) {
            if(!wealthId) return callback();

            query('SELECT wealth_id AS id FROM creature_is_wealth WHERE creature_id = ?', [id], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                currentWealth = parseInt(results[0].id);

                callback();
            });
        },
        function(callback) {
            if(!wealthId) return callback();

            relationValues(user, id, 'wealth', 'attribute', wealthId, currentWealth, callback);
        },
        function(callback) {
            connectionTable(id, 'wealth', wealthId, callback);
        }

    ], function(err) {
        callback(err);
    });
};