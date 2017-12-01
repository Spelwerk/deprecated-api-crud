'use strict';

let AppError = require('../errors/app-error'),
    UserNotLoggedInError = require('../errors/user-not-logged-in-error');

let async = require('async'),
    query = require('../sql/query'),
    combination = require('../sql/combination'),
    ownership = require('../sql/ownership'),
    relation = require('../sql/relation'),
    sequel = require('../sql/sequel'),
    unique = require('../sql/unique');

/**
 * Sets creature combination text
 *
 * @param creatureId Integer
 * @param combination String
 * @param combinationText String
 * @param callback
 * @returns callback(err)
 */

function combinationText(creatureId, combination, combinationText, callback) {
    creatureId = parseInt(creatureId);

    if(!combinationText) return callback();

    query('INSERT INTO creature_' + combination + ' (creature_id,' + combination + ') VALUES (?,?) ON DUPLICATE KEY UPDATE ' + combination + ' = VALUES(' + combination + ')', [creatureId, combinationText], callback);
}

/**
 * Adds values from relation table to the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param relationName String
 * @param additionId Integer
 * @param subtractionId Integer
 * @param callback
 * @returns callback(err)
 */

function relationValues(user, creatureId, tableName, relationName, additionId, subtractionId, callback) {
    creatureId = parseInt(creatureId);
    additionId = parseInt(additionId) || null;
    subtractionId = parseInt(subtractionId) || null;

    let creature_has_relation = 'creature_has_' + relationName,
        table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id';

    let array = [],
        arrayAdd = [],
        arraySubtract = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },

        // Getting the values
        function(callback) {
            if(!additionId && !subtractionId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + creature_has_relation + ' WHERE creature_id = ?', [creatureId], function(err, results) {
                if(err) return callback(err);

                for(let i in results) {
                    let id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    array.push({id: id, value: value, changed: false});
                }

                callback();
            });
        },
        function(callback) {
            if(!additionId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ?', [additionId], function(err, results) {
                if(err) return callback(err);

                for(let i in results) {
                    let id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    arrayAdd.push({id: id, value: value, changed: false});
                }

                callback();
            });
        },
        function(callback) {
            if(!subtractionId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ?', [subtractionId], function(err, results) {
                if(err) return callback(err);

                for(let i in results) {
                    let id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    arraySubtract.push({id: id, value: value, changed: false});
                }

                callback();
            });
        },

        // Setting the values
        function(callback) {
            if(!additionId && !subtractionId) return callback();

            let sql = 'INSERT INTO ' + creature_has_relation + ' (creature_id,' + relation_id + ',value) VALUES ',
                changed = false;

            // Loop through current attributes list
            for(let i in array) {

                // Loop through attributes in new wealth
                if(arrayAdd.length !== 0) {
                    for(let x in arrayAdd) {

                        // If IDs are matched, add to attributes list
                        if(array[i].id === arrayAdd[x].id) {
                            array[i].value = parseInt(array[i].value) + parseInt(arrayAdd[x].value);
                            array[i].changed = true;
                            arrayAdd[x].changed = true;
                        }
                    }
                }

                // Loop through attributes in current wealth
                if(arraySubtract.length !== 0) {
                    for(let k in arraySubtract) {

                        // If IDs are matched, subtract from attributes list
                        if(array[i].id === arraySubtract[k].id) {
                            array[i].value = parseInt(array[i].value) - parseInt(arraySubtract[k].value);
                            array[i].changed = true;
                            arraySubtract[k].changed = true;
                        }
                    }
                }
            }

            for(let j in array) {
                if(array[j].changed === true) {
                    sql += '(' + creatureId + ',' + array[j].id + ',' + array[j].value + '),';
                    changed = true;
                }
            }

            for(let n in arrayAdd) {
                if(arrayAdd[n].changed === false) {
                    sql += '(' + creatureId + ',' + arrayAdd[n].id + ',' + arrayAdd[n].value + '),';
                    changed = true;
                }
            }

            for(let z in arraySubtract) {
                if(arraySubtract[z].changed === false) {
                    sql += '(' + creatureId + ',' + arraySubtract[z].id + ',' + arraySubtract[z].value + '),';
                    changed = true;
                }
            }

            if(!changed) return callback();

            sql = sql.slice(0, -1) + ' ON DUPLICATE KEY UPDATE value = VALUES(value)';

            query(sql, null, callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Loop through an array of relation tables and add values to the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param relationArray Array
 * @param additionId Integer
 * @param subtractionId Integer
 * @param callback
 * @returns callback(err)
 */

function relationValuesEach(user, creatureId, tableName, relationArray, additionId, subtractionId, callback) {
    if(!relationArray || relationArray.length === 0) return callback();

    async.each(relationArray, function(relationName, next) {
        relationValues(user, creatureId, tableName, relationName, additionId, subtractionId, next);
    }, function(err) {
        callback(err);
    });
}

/**
 * Sets equipped status on an item and adds relation values to the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param tableId Integer
 * @param relationArray Array
 * @param boolean Boolean
 * @param callback
 * @returns callback(err)
 */

function equip(user, creatureId, tableName, tableId, relationArray, boolean, callback) {
    creatureId = parseInt(creatureId);
    tableId = parseInt(tableId);
    boolean = !!parseInt(boolean);

    let creature_has_table = 'creature_has_' + tableName,
        table_id = tableName + '_id';

    let equipped;

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('SELECT equipped FROM ' + creature_has_table + ' WHERE creature_id = ? AND ' + table_id + ' = ?', [creatureId, tableId], function(err, results) {
                if(err) return callback(err);

                equipped = !!results[0].equipped;

                callback();
            });
        },
        function(callback) {
            if((equipped && boolean) || (!equipped && !boolean)) return callback();

            let addId = boolean ? tableId : null,
                subId = boolean ? null : tableId;

            relationValuesEach(user, creatureId, tableName, relationArray, addId, subId, callback);
        },
        function(callback) {
            if((equipped && boolean) || (!equipped && !boolean)) return callback();

            query('UPDATE ' + creature_has_table + ' SET equipped = ? WHERE creature_id = ? AND ' + table_id + ' = ?', [boolean, creatureId, tableId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Sets equipped status on an augmentation and adds relation values, and weapons to the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param bionicId Integer
 * @param augmentationId Integer
 * @param relationArray Array
 * @param boolean Boolean
 * @param callback
 * @returns callback(err)
 */

function activate(user, creatureId, bionicId, augmentationId, relationArray, boolean, callback) {
    creatureId = parseInt(creatureId);
    bionicId = parseInt(bionicId);
    augmentationId = parseInt(augmentationId);
    boolean = !!parseInt(boolean);

    let equipped;

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('SELECT equipped FROM creature_has_augmentation WHERE creature_id = ? AND bionic_id = ? AND augmentation_id = ?', [creatureId, bionicId, augmentationId], function(err, results) {
                if(err) return callback(err);

                equipped = !!results[0].equipped;

                callback();
            });
        },
        function(callback) {
            if((equipped && boolean) || (!equipped && !boolean)) return callback();

            let addId = boolean ? augmentationId : null,
                subId = boolean ? null : augmentationId;

            relationValuesEach(user, creatureId, 'augmentation', relationArray, addId, subId, callback);
        },
        function(callback) {
            if((equipped && boolean) || (!equipped && !boolean)) return callback();

            if(!boolean) return callback();

            weaponAdd(user, creatureId, 'augmentation', augmentationId, callback);
        },
        function(callback) {
            if((equipped && boolean) || (!equipped && !boolean)) return callback();

            if(boolean) return callback();

            weaponRemove(user, creatureId, 'augmentation', augmentationId, callback);
        },
        function(callback) {
            if((equipped && boolean) || (!equipped && !boolean)) return callback();

            query('UPDATE creature_has_augmentation SET equipped = ? WHERE creature_id = ? AND bionic_id = ? AND augmentation_id = ?', [boolean, creatureId, bionicId, augmentationId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Selects all weapons related to a table row, and add it to the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param tableId Integer
 * @param callback
 * @returns callback(err)
 */

function weaponAdd(user, creatureId, tableName, tableId, callback) {
    creatureId = parseInt(creatureId);
    tableId = parseInt(tableId);

    let weapon_is_table = 'weapon_is_' + tableName,
        table_id = tableName + '_id';

    let weaponArray = [],
        alreadyHas = false;

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('SELECT weapon_id AS id FROM ' + weapon_is_table + ' WHERE ' + table_id + ' = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                // Loop through results from world list and push the values into our new attribute array
                for(let i in results) {
                    let id = parseInt(results[i].id);

                    weaponArray.push({id: id});
                }

                callback();
            });
        },
        function(callback) {
            query('SELECT weapon_id AS id FROM creature_has_weapon WHERE creature_id = ?', [creatureId], function(err, results) {
                if(err) return callback(err);

                for(let i in results) {
                    let id = parseInt(results[i].id);

                    for(let k in weaponArray) {
                        if(id === parseInt(weaponArray[k].id)) {
                            alreadyHas = true;
                        }
                    }
                }

                callback();
            });
        },
        function(callback) {
            if(weaponArray.length === 0 || alreadyHas) return callback();

            let sql = 'INSERT INTO creature_has_weapon (creature_id,weapon_id,value,equipped) VALUES ';

            // Create the query
            for(let i in weaponArray) {
                sql += '(' + creatureId + ',' + weaponArray[i].id + ',1,1),';
            }

            sql = sql.slice(0, -1);

            query(sql, null, callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Selects all weapons related to a table row, and remove it from the creature
 *
 * @param user Object
 * @param creatureId Integer
 * @param tableName String
 * @param tableId Integer
 * @param callback
 * @returns callback(err)
 */

function weaponRemove(user, creatureId, tableName, tableId, callback) {
    creatureId = parseInt(creatureId);
    tableId = parseInt(tableId);

    let weapon_is_table = 'weapon_is_' + tableName,
        table_id = tableName + '_id';

    let weaponArray = [];

    async.series([
        function(callback) {
            ownership(user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('SELECT weapon_id AS id FROM ' + weapon_is_table + ' WHERE ' + table_id + ' = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                // Loop through results from world list and push the values into our new attribute array
                for(let i in results) {
                    let id = parseInt(results[i].id);

                    weaponArray.push({id: id});
                }

                callback();
            });
        },
        function(callback) {
            if(weaponArray.length === 0) return callback();

            let sql = 'DELETE FROM creature_has_weapon WHERE creature_id = ? AND (';

            // Create the query
            for(let i in weaponArray) {
                sql += 'weapon_id = ' + weaponArray[i].id + ' OR ';
            }

            sql = sql.slice(0, -4) + ')';

            query(sql, [creatureId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Creates a creature in table
 *
 * @param user Object
 * @param firstName String
 * @param worldId Integer
 * @param speciesId Integer
 * @param optional Object { nickName, middleName, lastName, description }
 * @param callback
 * @returns callback(err, id)
 */

function post(user, firstName, worldId, speciesId, optional, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    worldId = parseInt(worldId);
    speciesId = parseInt(speciesId);

    let id,
        nickName = optional.nickName || null,
        middleName = optional.middleName || null,
        lastName = optional.lastName || null,
        description = optional.description || null;

    let attributeArray = [],
        skillArray = [];

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
            let sql = 'SELECT ' +
                'attribute.id, ' +
                'world_has_attribute.value ' +
                'FROM world_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = world_has_attribute.attribute_id ' +
                'WHERE ' +
                'world_has_attribute.world_id = ?';

            query(sql, [worldId], function(err, results) {
                if(err) return callback(err);

                // Loop through results from world list and push the values into attribute array
                for(let i in results) {
                    let id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    attributeArray.push({id: id, value: value});
                }

                callback();
            });
        },
        function(callback) {
            query('SELECT attribute_id AS id, value FROM species_has_attribute WHERE species_id = ?', [speciesId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                // Loop through results array
                for(let i in results) {
                    let id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    // Then loop through attributes array and add species values together if the species attribute exists in the world list
                    for(let n in attributeArray) {
                        if(attributeArray[n].id === id) {
                            attributeArray[n].value += value;
                        }
                    }
                }

                callback();
            });
        },
        function(callback) {
            let sql = 'INSERT INTO creature_has_attribute (creature_id,attribute_id,value) VALUES ';

            // Create the query
            for(let x in attributeArray) {
                sql += '(' + id + ',' + attributeArray[x].id + ',' + attributeArray[x].value + '),';
            }

            sql = sql.slice(0, -1);

            query(sql, null, callback);
        },
        function(callback) {
            let sql = 'SELECT skill_id AS id FROM world_has_skill WHERE world_has_skill.world_id = ?';

            query(sql, [worldId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                // Loop through results from world list and push the values into skill array
                for(let i in results) {
                    skillArray.push({id: results[i].id});
                }

                callback();
            });
        },
        function(callback) {
            if(skillArray.length === 0) return callback;

            let sql = 'SELECT skill_id AS id FROM skill_is_species WHERE species_id = ?';

            query(sql, [speciesId], function(err, results) {
                if(err) return callback(err);

                // Loop through results from world list and push the values into skill array
                for(let i in results) {
                    skillArray.push({id: results[i].id});
                }

                callback();
            });
        },
        function(callback) {
            let sql = 'INSERT INTO creature_has_skill (creature_id,skill_id) VALUES ';

            // Create the query
            for(let x in skillArray) {
                sql += '(' + id + ',' + skillArray[x].id + '),';
            }

            sql = sql.slice(0, -1);

            query(sql, null, callback);
        },
        function(callback) {
            weaponAdd(user, id, 'species', speciesId, callback);
        },
        function(callback) {
            query('INSERT INTO user_has_creature (user_id,creature_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
}

module.exports.post = post;

/**
 * Updates a creature with new values
 *
 * @param user Object
 * @param id Integer
 * @param optional Object {firstName, nickName, middleName, lastName, calculated, manifestation, appearance, age, biography, description, drive, gender, occupation, personality, pride, problem, shame, pointDoctrine, pointExpertise, pointGift, pointImperfection, pointMilestone, pointSkill, corporationId, countryId, identityId, natureId, wealthId }
 * @param callback
 * @returns callback(err)
 */

function put(user, id, optional, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    id = parseInt(id);

    let update = {
        firstname: optional.firstName || null,
        nickname: optional.nickName || null,
        middlename: optional.middleName || null,
        lastname: optional.lastName || null,
        calculated: optional.calculated || null,
        manifestation: optional.manifestation || null
    };

    let points = {
        point_doctrine: optional.pointDoctrine || null,
        point_expertise: optional.pointExpertise || null,
        point_gift: optional.pointGift || null,
        point_imperfection: optional.pointImperfection || null,
        point_milestone: optional.pointMilestone || null,
        point_skill: optional.pointSkill || null
    };

    let appearance = optional.appearance || null,
        age = parseInt(optional.age) || null,
        biography = optional.biography || null,
        description = optional.description || null,
        drive = optional.drive || null,
        gender = optional.gender || null,
        occupation = optional.occupation || null,
        personality = optional.personality || null,
        pride = optional.pride || null,
        problem = optional.problem || null,
        shame = optional.shame || null;

    let corporationId = parseInt(optional.corporationId) || null,
        countryId = parseInt(optional.countryId) || null,
        identityId = parseInt(optional.identityId) || null,
        natureId = parseInt(optional.natureId) || null,
        wealthId = parseInt(optional.wealthId) || null;

    let currentWealth = null;

    async.series([
        function(callback) {
            ownership(user, 'creature', id, callback);
        },
        function(callback) {
            let sql = 'UPDATE creature SET ',
                values = [];

            for(let i in update) {
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
            let insert = 'INSERT INTO creature_points (creature_id,',
                duplicate = ' ON DUPLICATE KEY UPDATE ',
                values = ' VALUES (' + id + ',',
                changed = false;

            for(let i in points) {
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

            let sql = insert + values + duplicate;

            query(sql, null, callback);
        },
        function(callback) {
            combinationText(id, 'appearance', appearance, callback);
        },
        function(callback) {
            combinationText(id, 'age', age, callback);
        },
        function(callback) {
            combinationText(id, 'biography', biography, callback);
        },
        function(callback) {
            combinationText(id, 'description', description, callback);
        },
        function(callback) {
            combinationText(id, 'drive', drive, callback);
        },
        function(callback) {
            combinationText(id, 'gender', gender, callback);
        },
        function(callback) {
            combinationText(id, 'occupation', occupation, callback);
        },
        function(callback) {
            combinationText(id, 'personality', personality, callback);
        },
        function(callback) {
            combinationText(id, 'pride', pride, callback);
        },
        function(callback) {
            combinationText(id, 'problem', problem, callback);
        },
        function(callback) {
            combinationText(id, 'shame', shame, callback);
        },
        function(callback) {
            combination('creature', id, 'corporation', corporationId, callback);
        },
        function(callback) {
            combination('creature', id, 'country', countryId, callback);
        },
        function(callback) {
            combination('creature', id, 'identity', identityId, callback);
        },
        function(callback) {
            combination('creature', id, 'nature', natureId, callback);
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
            combination('creature', id, 'wealth', wealthId, callback);
        }
    ], function(err) {
        callback(err);
    });
}

module.exports.put = put;

// RELATIONS

module.exports.assets = function(router) {
    let table = 'asset',
        array = ['attribute', 'doctrine', 'skill'],
        sql = 'SELECT ' +
            'asset.id, ' +
            'asset.name, ' +
            'asset.description, ' +
            'creature_has_asset.custom, ' +
            'asset.equipable, ' +
            'asset.legal, ' +
            'asset.price, ' +
            'creature_has_asset.equipped, ' +
            'creature_has_asset.value, ' +
            'asset.assettype_id, ' +
            'assettype.name AS assettype_name ' +
            'FROM creature_has_asset ' +
            'LEFT JOIN asset ON asset.id = creature_has_asset.asset_id ' +
            'LEFT JOIN assettype ON assettype.id = asset.assettype_id';

    router.route('/:id/assets')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/assets/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId, ['equipped']);
        })
        .delete(function(req, res, next) {
            async.each([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    equip(req.user, req.params.id, table, req.params.itemId, array, false, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_' + table + ' WHERE creature_id = ? AND ' + table + '_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/assets/:itemId/equip/:equip')
        .put(function(req, res, next) {
            equip(req.user, req.params.id, table, req.params.itemId, array, req.params.equip, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.attributes = function(router) {
    let table = 'attribute',
        sql = 'SELECT ' +
            'attribute.id, ' +
            'attribute.name, ' +
            'attribute.description, ' +
            'creature_has_attribute.value, ' +
            'attribute.attributetype_id, ' +
            'attributetype.name AS attributetype_name ' +
            'FROM creature_has_attribute ' +
            'LEFT JOIN attribute ON attribute.id = creature_has_attribute.attribute_id ' +
            'LEFT JOIN attributetype ON attributetype.id = attribute.attributetype_id';

    router.route('/:id/attributes')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/attributes/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.backgrounds = function(router) {
    let table = 'background',
        array = ['asset', 'attribute', 'doctrine', 'skill', 'weapon'],
        sql = 'SELECT ' +
            'background.id, ' +
            'background.name, ' +
            'background.description, ' +
            'creature_has_background.custom, ' +
            'background.icon ' +
            'FROM creature_has_background ' +
            'LEFT JOIN background ON background.id = creature_has_background.background_id';

    router.route('/:id/backgrounds')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    query('INSERT INTO creature_has_' + table + ' (creature_id,' + table + '_id) VALUES (?,?)', [req.params.id, req.body.insert_id], callback);
                },
                function(callback) {
                    relationValuesEach(req.user, req.params.id, table, array, req.body.insert_id, null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/backgrounds/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    relationValuesEach(req.user, req.params.id, table, array, null, req.params.itemId, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_' + table + ' WHERE creature_id = ? AND ' + table + '_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
}; //todo add bionic(equipped and values)

module.exports.bionics = function(router) {
    let table = 'bionic',
        array = ['attribute', 'skill'],
        sql = 'SELECT ' +
            'bionic.id, ' +
            'bionic.name, ' +
            'bionic.description, ' +
            'creature_has_bionic.custom, ' +
            'bionic.icon, ' +
            'bionic.legal, ' +
            'bionic.price, ' +
            'bionic.hacking_difficulty, ' +
            'creature_has_bionic.value, ' +
            'bionic.bodypart_id, ' +
            'bodypart.name AS bodypart_name ' +
            'FROM creature_has_bionic ' +
            'LEFT JOIN bionic ON bionic.id = creature_has_bionic.bionic_id ' +
            'LEFT JOIN bodypart ON bodypart.id = bionic.bodypart_id';

    router.route('/:id/bionics')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    query('INSERT INTO creature_has_' + table + ' (creature_id,' + table + '_id) VALUES (?,?)', [req.params.id, req.body.insert_id], callback);
                },
                function(callback) {
                    relationValuesEach(req.user, req.params.id, table, array, req.body.insert_id, null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/bionics/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId, ['equipped']);
        })
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    relationValuesEach(req.user, req.params.id, table, array, null, req.params.itemId, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_' + table + ' WHERE creature_id = ? AND ' + table + '_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/bionics/:itemId/augmentations')
        .get(function(req, res, next) {
            let call = 'SELECT ' +
                'augmentation.id, ' +
                'augmentation.name, ' +
                'augmentation.description, ' +
                'augmentation.legal, ' +
                'augmentation.price, ' +
                'augmentation.hacking_difficulty, ' +
                'creature_has_augmentation.equipped ' +
                'FROM creature_has_augmentation ' +
                'LEFT JOIN augmentation ON augmentation.id = creature_has_augmentation.augmentation_id ' +
                'WHERE ' +
                'creature_has_augmentation.creature_id = ? AND ' +
                'creature_has_augmentation.bionic_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId]);
        })
        .post(function(req, res, next) {
            let id = parseInt(req.params.id),
                bionicId = parseInt(req.body.bionic_id),
                augmentationId = parseInt(req.body.insert_id);

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', id, callback);
                },
                function(callback) {
                    query('SELECT bionic_id FROM creature_has_bionic WHERE creature_id = ? AND bionic_id = ?', [id, bionicId], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new AppError(400, 'Request Error', 'Bionic is not equipped on creature', 'The bionic supplied in the request does not exist on the creature.'));

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT augmentation_id FROM bionic_has_augmentation WHERE bionic_id = ? AND augmentation_id = ?', [bionicId, augmentationId], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new AppError(400, 'Request Error', 'Augmentation not associated with bionic', 'The specified augmentation is not associated with that bionic.'));

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO creature_has_augmentation (creature_id,bionic_id,augmentation_id) VALUES (?,?,?)', [id, bionicId, augmentationId], callback);
                },
                function(callback) {
                    activate(req.user, id, bionicId, augmentationId, array, true, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/bionics/:itemId/augmentations/:augmentationId')
        .delete(function(req, res, next) {
            let id = parseInt(req.params.id),
                bionicId = parseInt(req.params.itemId),
                augmentationId = parseInt(req.params.augmentationId);

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', id, callback);
                },
                function(callback) {
                    activate(req.user, id, bionicId, augmentationId, array, false, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_augmentation WHERE creature_id = ? AND augmentation_id = ?', [id, augmentationId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/bionics/:itemId/augmentations/:augmentationId/equip/:equip')
        .put(function(req, res, next) {
            let id = parseInt(req.params.id),
                bionicId = parseInt(req.params.itemId),
                augmentationId = parseInt(req.params.augmentationId),
                augmentationRelationArray = ['attribute', 'expertise', 'skill'],
                equip = !!req.params.equip;

            activate(req.user, id, bionicId, augmentationId, augmentationRelationArray, equip, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.doctrines = function(router) {
    let table = 'doctrine',
        sql = 'SELECT ' +
            'doctrine.id, ' +
            'doctrine.name, ' +
            'doctrine.description, ' +
            'doctrine.icon, ' +
            'doctrine.expertise_id, ' +
            'doctrine.manifestation_id, ' +
            'doctrine.maximum, ' +
            'doctrine.effect, ' +
            'creature_has_doctrine.value ' +
            'FROM creature_has_doctrine ' +
            'LEFT JOIN doctrine ON doctrine.id = creature_has_doctrine.doctrine_id';

    router.route('/:id/doctrines')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/doctrines/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.expertises = function(router) {
    let table = 'expertise',
        sql = 'SELECT ' +
            'expertise.id, ' +
            'expertise.name, ' +
            'expertise.description, ' +
            'creature_has_expertise.custom, ' +
            'skill.icon, ' +
            'expertise.skill_id, ' +
            'skill.name AS skill_name, ' +
            'creature_has_expertise.value ' +
            'FROM creature_has_expertise ' +
            'LEFT JOIN expertise ON expertise.id = creature_has_expertise.expertise_id ' +
            'LEFT JOIN skill ON skill.id = expertise.skill_id';

    router.route('/:id/expertises')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/expertises/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.forms = function(router) {
    let table = 'form',
        sql = 'SELECT ' +
            'form.id, ' +
            'form.name, ' +
            'form.description, ' +
            'form.icon, ' +
            'form.manifestation_id, ' +
            'form.expertise_id, ' +
            'form.species_id, ' +
            'form.appearance ' +
            'FROM creature_has_form ' +
            'LEFT JOIN form ON form.id = creature_has_form.form_id';

    router.route('/:id/forms')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/forms/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.gifts = function(router) {
    let table = 'gift',
        array = ['attribute', 'skill'],
        sql = 'SELECT ' +
            'gift.id, ' +
            'gift.name, ' +
            'gift.description,' +
            'creature_has_gift.custom ' +
            'FROM creature_has_gift ' +
            'LEFT JOIN gift ON gift.id = creature_has_gift.gift_id';

    router.route('/:id/gifts')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    query('INSERT INTO creature_has_' + table + ' (creature_id,' + table + '_id) VALUES (?,?)', [req.params.id, req.body.insert_id], callback);
                },
                function(callback) {
                    relationValuesEach(req.user, req.params.id, table, array, req.body.insert_id, null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/gifts/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    relationValuesEach(req.user, req.params.id, table, array, null, req.params.itemId, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_' + table + ' WHERE creature_id = ? AND ' + table + '_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.imperfections = function(router) {
    let table = 'imperfection',
        array = ['attribute', 'skill'],
        sql = 'SELECT ' +
            'imperfection.id, ' +
            'imperfection.name, ' +
            'imperfection.description, ' +
            'creature_has_imperfection.custom ' +
            'FROM creature_has_imperfection ' +
            'LEFT JOIN imperfection ON imperfection.id = creature_has_imperfection.imperfection_id';

    router.route('/:id/imperfections')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    query('INSERT INTO creature_has_' + table + ' (creature_id,' + table + '_id) VALUES (?,?)', [req.params.id, req.body.insert_id], callback);
                },
                function(callback) {
                    relationValuesEach(req.user, req.params.id, table, array, req.body.insert_id, null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/imperfections/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    relationValuesEach(req.user, req.params.id, table, array, null, req.params.itemId, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_' + table + ' WHERE creature_id = ? AND ' + table + '_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.languages = function(router) {
    let table = 'language',
        sql = 'SELECT ' +
            'language.id, ' +
            'language.name, ' +
            'language.description, ' +
            'creature_has_language.fluent ' +
            'FROM creature_has_language ' +
            'LEFT JOIN language ON language.id = creature_has_language.language_id';

    router.route('/:id/languages')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/languages/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.loyalties = function(router) {
    let sql = 'SELECT ' +
        'creature_has_loyalty.id, ' +
        'creature_has_loyalty.milestone_id, ' +
        'creature_has_loyalty.loyalty_id, ' +
        'creature_has_loyalty.wealth_id, ' +
        'creature_has_loyalty.name, ' +
        'creature_has_loyalty.occupation, ' +
        'loyalty.name AS loyalty_name, ' +
        'wealth.name AS wealth_name ' +
        'FROM creature_has_loyalty ' +
        'LEFT JOIN loyalty ON loyalty.id = creature_has_loyalty.loyalty_id ' +
        'LEFT JOIN wealth ON wealth.id = creature_has_loyalty.wealth_id';

    router.route('/:id/loyalties')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_loyalty.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            let creatureId = parseInt(req.params.id),
                loyaltyId = parseInt(req.body.insert_id),
                wealthId = parseInt(req.body.wealth_id),
                name = req.body.name || null,
                occupation = req.body.occupation || null,
                uqId;

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', creatureId, callback);
                },
                function(callback) {
                    query('INSERT INTO creature_has_loyalty (creature_id,loyalty_id,wealth_id,name,occupation) VALUES (?,?,?,?,?)', [creatureId, loyaltyId, wealthId, name, occupation], function(err, result) {
                        if(err) return callback(err);

                        uqId = result.insertId;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: uqId});
            });
        });

    router.route('/:id/loyalties/:uqId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_loyalty.creature_id = ? AND ' +
                'creature_has_loyalty.id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.uqId], true);
        })
        .put(function(req, res, next) {
            let creatureId = parseInt(req.params.id),
                loyaltyId = parseInt(req.params.uqId),
                wealthId = parseInt(req.body.wealth_id),
                name = req.body.name || null,
                occupation = req.body.occupation || null;

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', creatureId, callback);
                },
                function(callback) {
                    query('UPDATE creature_has_loyalty SET wealth_id = ?, name = ?, occupation = ? WHERE creature_id = ? AND id = ?', [wealthId, name, occupation, creatureId, loyaltyId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            let creatureId = parseInt(req.params.id),
                loyaltyId = parseInt(req.params.uqId);

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_loyalty WHERE creature_id = ? AND loyalty_id = ?', [creatureId, loyaltyId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/loyalties/:uqId/creature')
        .post(function(req, res, next) {

        });
};

module.exports.manifestations = function(router) {
    let table = 'manifestation',
        sql = 'SELECT ' +
            'manifestation.id, ' +
            'manifestation.name, ' +
            'manifestation.description, ' +
            'manifestation.icon, ' +
            'creature_has_manifestation.focus_id,' +
            'focus.name AS focus_name,' +
            'focus.description AS focus_description,' +
            'focus.icon AS focus_icon ' +
            'FROM creature_has_manifestation ' +
            'LEFT JOIN manifestation ON manifestation.id = creature_has_manifestation.manifestation_id ' +
            'LEFT JOIN focus ON focus.id = creature_has_manifestation.focus_id';

    router.route('/:id/manifestations')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            let id = parseInt(req.params.id),
                itemId = parseInt(req.body.insert_id),
                attributeId,
                skillArray = [];

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    query('INSERT INTO creature_has_manifestation (creature_id,manifestation_id) VALUES (?,?)', [id, itemId], callback);
                },
                function(callback) {
                    query('SELECT attribute_id AS id FROM manifestation WHERE id = ?', [itemId], function(err, results) {
                        if(err) return callback(err);

                        attributeId = parseInt(results[0].id);

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO creature_has_attribute (creature_id,attribute_id,value) VALUES (?,?,4)', [id, attributeId], callback);
                },
                function(callback) {
                    query('SELECT skill_id AS id FROM skill_is_manifestation WHERE manifestation_id = ?', [itemId], function(err, results) {
                        if(err) return callback(err);

                        for(let i in results) {
                            skillArray.push({id: parseInt(results[i].id)});
                        }

                        callback();
                    });
                },
                function(callback) {
                    let sql = 'INSERT INTO creature_has_skill (creature_id,skill_id) VALUES ';

                    // Create the query
                    for(let x in skillArray) {
                        sql += '(' + id + ',' + skillArray[x].id + '),';
                    }

                    sql = sql.slice(0, -1);

                    query(sql, null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/manifestations/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            //todo attribute_id from manifestation //skill_id from skill_is_manifestation
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.milestones = function(router) {
    let table = 'milestone',
        array = ['asset', 'attribute', 'doctrine', 'skill', 'weapon'],
        sql = 'SELECT ' +
            'milestone.id, ' +
            'milestone.name, ' +
            'milestone.description, ' +
            'creature_has_milestone.custom ' +
            'FROM creature_has_milestone ' +
            'LEFT JOIN milestone ON milestone.id = creature_has_milestone.milestone_id';

    router.route('/:id/milestones')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            let creatureId = parseInt(req.params.id),
                milestoneId = parseInt(req.body.insert_id),
                loyaltyArray = [];

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', creatureId, callback);
                },
                function(callback) {
                    query('INSERT INTO creature_has_' + table + ' (creature_id,' + table + '_id) VALUES (?,?)', [req.params.id, req.body.insert_id], callback);
                },
                function(callback) {
                    relationValuesEach(req.user, creatureId, table, array, milestoneId, null, callback);
                },
                function(callback) {
                    query('SELECT * FROM milestone_has_loyalty WHERE milestone_id = ?', [milestoneId], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback;

                        for(let i in results) {
                            let lId = results[i].loyalty_id,
                                wId = results[i].wealth_id,
                                wOc = results[i].occupation;

                            loyaltyArray.push({loyaltyId: lId, wealthId: wId, occupation: wOc});
                        }

                        callback();
                    });
                },
                function(callback) {
                    if(loyaltyArray.length === 0) return callback();

                    async.each(loyaltyArray, function(object, next) {
                        let loyaltyId = object.loyaltyId,
                            wealthId = object.wealthId,
                            occupation = object.occupation;

                        query('INSERT INTO creature_has_loyalty (creature_id,loyalty_id,wealth_id,milestone_id,occupation) VALUES (?,?,?,?,?)', [creatureId, loyaltyId, wealthId, milestoneId, occupation], next);
                    }, function(err) {
                        callback(err);
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/milestones/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    relationValuesEach(req.user, req.params.id, table, array, null, req.params.itemId, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_' + table + ' WHERE creature_id = ? AND ' + table + '_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
}; //todo add bionic(equipped and values)

module.exports.protection = function(router) {
    let table = 'protection',
        array = ['attribute', 'doctrine', 'skill'],
        sql = 'SELECT ' +
            'protection.id, ' +
            'protection.name, ' +
            'protection.description, ' +
            'creature_has_protection.custom, ' +
            'protection.icon, ' +
            'protection.price, ' +
            'creature_has_protection.equipped, ' +
            'creature_has_protection.value, ' +
            'protection.bodypart_id, ' +
            'bodypart.name AS bodypart_name ' +
            'FROM creature_has_protection ' +
            'LEFT JOIN protection ON protection.id = creature_has_protection.protection_id ' +
            'LEFT JOIN bodypart on bodypart.id = protection.bodypart_id';

    router.route('/:id/protection')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/protection/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId, ['equipped']);
        })
        .delete(function(req, res, next) {
            async.each([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    equip(req.user, req.params.id, table, req.params.itemId, array, false, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_' + table + ' WHERE creature_id = ? AND ' + table + '_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/protection/:itemId/equip/:equip')
        .put(function(req, res, next) {
            equip(req.user, req.params.id, table, req.params.itemId, array, req.params.equip, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.relations = function(router) {}; //todo //loyalty_id milestone_id owner

module.exports.skills = function(router) {
    let table = 'skill',
        sql = 'SELECT ' +
            'skill.id, ' +
            'skill.name, ' +
            'skill.description, ' +
            'skill.icon, ' +
            'creature_has_skill.value ' +
            'FROM creature_has_skill ' +
            'LEFT JOIN skill ON skill.id = creature_has_skill.skill_id';

    router.route('/:id/skills')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/skills/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.species = function(router) {
    let table = 'species',
        sql = 'SELECT ' +
            'species.id, ' +
            'species.name, ' +
            'species.description, ' +
            'creature_has_species.custom, ' +
            'species.icon, ' +
            'creature_has_species.first ' +
            'FROM creature_has_species ' +
            'LEFT JOIN species ON species.id = creature_has_species.species_id';

    router.route('/:id/species')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id, ['first']);
        });

    router.route('/:id/species/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId, ['first']);
        })
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    query('SELECT first FROM creature_has_species WHERE creature_id = ? AND species_id = ?', [req.params.id, req.params.itemId], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0].first) return callback(new AppError(403, 'Forbidden', 'The primary species may not be removed from a creature.', 'Removal of the primary species is impossible as it is too important to the character\'s creation and longevity.'));

                        callback();
                    });
                },
                function(callback) {
                    query('DELETE FROM creature_has_' + table + ' WHERE creature_id = ? AND ' + table + '_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.spells = function(router) {
    let table = 'spell',
        sql = 'SELECT ' +
            'spell.id, ' +
            'spell.name, ' +
            'spell.description, ' +
            'spell.icon, ' +
            'spell.effect, ' +
            'spell.effect_dice, ' +
            'spell.effect_bonus, ' +
            'spell.damage_dice, ' +
            'spell.damage_bonus, ' +
            'spell.critical_dice, ' +
            'spell.critical_bonus, ' +
            'spell.distance, ' +
            'spell.cost, ' +
            'spell_is_attribute.attribute_id ' +
            'FROM creature_has_spell ' +
            'LEFT JOIN spell ON spell.id = creature_has_spell.spell_id ' +
            'LEFT JOIN spell_is_attribute ON spell_is_attribute.spell_id = spell.id';

    router.route('/:id/spells')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/spells/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.software = function(router) {
    let table = 'software',
        sql = 'SELECT ' +
            'software.id, ' +
            'software.name, ' +
            'software.description, ' +
            'software.legal, ' +
            'software.price, ' +
            'software.hacking_difficulty, ' +
            'software.hacking_bonus, ' +
            'software.softwaretype_id, ' +
            'softwaretype.name AS softwaretype_name ' +
            'FROM creature_has_software ' +
            'LEFT JOIN software ON software.id = creature_has_software.software_id ' +
            'LEFT JOIN softwaretype ON softwaretype.id = software.softwaretype_id';

    router.route('/:id/software')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/software/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.weapons = function(router) {
    let table = 'weapon',
        array = ['attribute', 'doctrine', 'skill'],
        sql = 'SELECT ' +
            'weapon.id, ' +
            'weapon.name, ' +
            'weapon.description, ' +
            'creature_has_weapon.custom, ' +
            'weapontype.icon, ' +
            'weapon.legal, ' +
            'weapon.price, ' +
            'weapon.damage_dice, ' +
            'weapon.damage_bonus, ' +
            'weapon.critical_dice, ' +
            'weapon.critical_bonus, ' +
            'weapon.distance, ' +
            'weapontype.attribute_id, ' +
            'weapontype.expertise_id, ' +
            'weapontype.augmentation, ' +
            'weapontype.species, ' +
            'weapontype.equipable, ' +
            'creature_has_weapon.equipped, ' +
            'creature_has_weapon.value, ' +
            'weapon.weapontype_id, ' +
            'weapontype.name AS weapontype_name ' +
            'FROM creature_has_weapon ' +
            'LEFT JOIN weapon ON weapon.id = creature_has_weapon.weapon_id ' +
            'LEFT JOIN weapontype ON weapontype.id = weapon.weapontype_id';

    router.route('/:id/weapons')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
        });

    router.route('/:id/weapons/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, 'creature', req.params.id, table, req.params.itemId, ['equipped']);
        })
        .delete(function(req, res, next) {
            async.each([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    equip(req.user, req.params.id, table, req.params.itemId, array, false, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_' + table + ' WHERE creature_id = ? AND ' + table + '_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/weapons/:itemId/equip/:equip')
        .put(function(req, res, next) {
            equip(req.user, req.params.id, table, req.params.itemId, array, req.params.equip, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/weapons/:itemId/mods')
        .get(function(req, res, next) {
            let call = 'SELECT ' +
                'weaponmod.id, ' +
                'weaponmod.name, ' +
                'weaponmod.description, ' +
                'weaponmod.icon, ' +
                'weaponmod.short, ' +
                'weaponmod.price, ' +
                'weaponmod.damage_dice, ' +
                'weaponmod.damage_bonus, ' +
                'weaponmod.critical_dice, ' +
                'weaponmod.critical_bonus, ' +
                'weaponmod.distance ' +
                'FROM creature_has_weaponmod ' +
                'LEFT JOIN weaponmod ON weaponmod.id = creature_has_weaponmod.weaponmod_id ' +
                'WHERE ' +
                'creature_has_weaponmod.creature_id = ? AND ' +
                'creature_has_weaponmod.weapon_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId]);
        })
        .post(function(req, res, next) {
            let creatureId = parseInt(req.params.id),
                weaponId = parseInt(req.params.itemId),
                modId = parseInt(req.body.insert_id);

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', creatureId, callback);
                },
                function(callback) {
                    query('SELECT weapon_id FROM creature_has_weapon WHERE creature_id = ? AND weapon_id = ?', [creatureId, weaponId], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0]) return callback(new AppError(400, 'Request Error', 'Weapon not on creature', 'The specified weapon is not in the creature list of weapons. Add it before you can add mods\''));

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT weaponmod_id FROM weapon_has_weaponmod WHERE weapon_id = ? AND weaponmod_id = ?', [weaponId, modId], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0]) return callback(new AppError(400, 'Request Error', 'Mod not associated with weapon', 'The specified mod is not associated with that weapon. Did you send the correct insert_id?'));

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO creature_has_weaponmod (creature_id,weapon_id,weaponmod_id) VALUES (?,?,?)', [creatureId, weaponId, modId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/weapons/:itemId/mods/:modId')
        .delete(function(req, res, next) {
            async.each([
                function(callback) {
                    ownership(req.user, 'creature', req.params.id, callback);
                },
                function(callback) {
                    query('DELETE FROM creature_has_weaponmod WHERE creature_id = ? AND weapon_id = ? AND weaponmod_id = ?', [req.params.id, req.params.itemId, req.params.modId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
}; //todo weaponmod has attribute, add on equip and if weapon is already equipped

//todo forms, tactics

module.exports.corporation = function(router) {
    let sql = 'SELECT ' +
        'corporation.id, ' +
        'corporation.name, ' +
        'corporation.description ' +
        'FROM creature_is_corporation ' +
        'LEFT JOIN corporation ON corporation.id = creature_is_corporation.corporation_id';

    router.route('/:id/corporation')
        .get(function(req, res, next) {
            let call = sql + ' WHERE creature_is_corporation.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        });
};

module.exports.country = function(router) {
    let sql = 'SELECT ' +
        'country.id, ' +
        'country.name, ' +
        'country.description ' +
        'FROM creature_is_country ' +
        'LEFT JOIN country ON country.id = creature_is_country.country_id';

    router.route('/:id/country')
        .get(function(req, res, next) {
            let call = sql + ' WHERE creature_is_country.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        });
};

module.exports.identity = function(router) {
    let sql = 'SELECT ' +
        'identity.id, ' +
        'identity.name, ' +
        'identity.description, ' +
        'identity.icon ' +
        'FROM creature_is_identity ' +
        'LEFT JOIN identity ON identity.id = creature_is_identity.identity_id';

    router.route('/:id/identity')
        .get(function(req, res, next) {
            let call = sql + ' WHERE creature_is_identity.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        });
};

module.exports.nature = function(router) {
    let sql = 'SELECT ' +
        'nature.id, ' +
        'nature.name, ' +
        'nature.description, ' +
        'nature.icon ' +
        'FROM creature_is_nature ' +
        'LEFT JOIN nature ON nature.id = creature_is_nature.nature_id';

    router.route('/:id/nature')
        .get(function(req, res, next) {
            let call = sql + ' WHERE creature_is_nature.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        });
};

module.exports.wealth = function(router) {
    let sql = 'SELECT ' +
        'wealth.id, ' +
        'wealth.name, ' +
        'wealth.description, ' +
        'wealth.icon ' +
        'FROM creature_is_wealth ' +
        'LEFT JOIN wealth ON wealth.id = creature_is_wealth.wealth_id';

    router.route('/:id/wealth')
        .get(function(req, res, next) {
            let call = sql + ' WHERE creature_is_wealth.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        });
};

module.exports.world = function(router) {
    let sql = 'SELECT ' +
        'world.id, ' +
        'world.name, ' +
        'world.description ' +
        'FROM creature ' +
        'LEFT JOIN world ON world.id = creature.world_id';

    router.route('/:id/world')
        .get(function(req, res, next) {
            let call = sql + ' WHERE creature.id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        });
};


/**
 * Changes the healed status of a wound
 *
 * @param req Object
 * @param res Object
 * @param next Object
 * @param creatureId Integer
 * @param tableName String
 * @param tableId Integer
 * @param healed Boolean
 */

function heal(req, res, next, creatureId, tableName, tableId, healed) {
    let creature_has_table = 'creature_has_' + tableName;

    healed = !!healed;

    async.series([
        function(callback) {
            ownership(req.user, 'creature', creatureId, callback);
        },
        function(callback) {
            query('UPDATE ' + creature_has_table + ' SET healed = ? WHERE id = ?', [healed, tableId], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
}

/**
 * Generic wounds
 *
 * @param router Object
 * @param route String
 * @param tableName String
 */

function wound(router, route, tableName) {
    let table = tableName,
        sql = 'SELECT ' +
            'creature_has_' + table + '.id, ' +
            'creature_has_' + table + '.value, ' +
            'creature_has_' + table + '.healed, ' +
            table + '.name ' +
            'FROM creature_has_' + table + ' ' +
            'LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/' + route)
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            let id = parseInt(req.params.id),
                value = parseInt(req.body.value),
                name = req.body.name,
                tableId,
                uqId;

            let creature_has_table = 'creature_has_' + table,
                table_id = table + '_id';

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', id, callback);
                },
                function(callback) {
                    unique.post(req.user, table, name, false, function(err, id) {
                        if(err) return callback(err);

                        tableId = id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO ' + creature_has_table + ' (creature_id,' + table_id + ',value) VALUES (?,?,?)', [id, tableId, value], function(err, result) {
                        if(err) return callback(err);

                        uqId = parseInt(result.insertId);

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: uqId});
            });
        });

    router.route('/:id/' + route + '/:uqId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.uqId], true);
        })
        .put(function(req, res, next) {
            let id = parseInt(req.params.id),
                uqId = parseInt(req.params.uqId),
                name = req.body.name,
                newId;

            let creature_has_table = 'creature_has_' + table,
                table_id = table + '_id';

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', id, callback);
                },
                function(callback) {
                    unique.post(req.user, table, name, false, function(err, id) {
                        if(err) return callback(err);

                        newId = id;

                        callback();
                    });
                },
                function(callback) {
                    query('UPDATE ' + creature_has_table + ' SET ' + table_id + ' = ? WHERE id = ?', [newId, uqId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            let id = parseInt(req.params.id),
                uqId = parseInt(req.params.uqId);

            let creature_has_table = 'creature_has_' + table;

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', id, callback);
                },
                function(callback) {
                    query('DELETE FROM ' + creature_has_table + ' WHERE id = ?', [uqId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/' + route + '/:uqId/value')
        .put(function(req, res, next) {
            let id = parseInt(req.params.id),
                uqId = parseInt(req.params.uqId),
                value = parseInt(req.body.value);

            let creature_has_table = 'creature_has_' + table;

            async.series([
                function(callback) {
                    ownership(req.user, 'creature', id, callback);
                },
                function(callback) {
                    query('UPDATE ' + creature_has_table + ' SET value = ? WHERE id = ?', [value, uqId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/' + route + '/:uqId/healed/:healed')
        .put(function(req, res, next) {
            heal(req, res, next, req.params.id, table, req.params.uqId, req.params.healed)
        });
}

module.exports.dementations = function(router) {
    wound(router, 'dementations', 'dementation');
};

module.exports.diseases = function(router) {
    wound(router, 'diseases', 'disease');
};

module.exports.traumas = function(router) {
    wound(router, 'traumas', 'trauma');
};

