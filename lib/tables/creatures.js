'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership'),
    relation = require('../sql/relation'),
    sequel = require('../sql/sequel');

function tableText(id, relation, text, callback) {
    id = parseInt(id);

    if(!text) return callback();

    query('INSERT INTO creature_' + relation + ' (creature_id,' + relation + ') VALUES (?,?) ON DUPLICATE KEY UPDATE ' + relation + ' = VALUES(' + relation + ')', [id, text], callback);
}

function tableId(id, connection, connectionId, callback) {
    id = parseInt(id);
    connectionId = parseInt(connectionId);

    if(!connectionId) return callback();

    query('INSERT INTO creature_is_' + connection + ' (creature_id,' + connection + '_id) VALUES (?,?) ON DUPLICATE KEY UPDATE ' + connection + '_id = VALUES(' + connection + '_id)', [id, connectionId], callback);
}

function relationValues(user, id, tableName, relationName, additionId, subtractionId, callback) {
    id = parseInt(id);
    additionId = parseInt(additionId) || null;
    subtractionId = parseInt(subtractionId) || null;

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
            if(!additionId && !subtractionId) return callback();

            query('SELECT ' + relation_id + ' AS id, value FROM ' + creature_has_relation + ' WHERE creature_id = ?', [id], function(err, results) {
                if(err) return callback(err);

                for(var i in results) {
                    var id = parseInt(results[i].id),
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

                for(var i in results) {
                    var id = parseInt(results[i].id),
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

                for(var i in results) {
                    var id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    arraySubtract.push({id: id, value: value, changed: false});
                }

                callback();
            });
        },

        // Setting the values
        function(callback) {
            if(!additionId && !subtractionId) return callback();

            var sql = 'INSERT INTO ' + creature_has_relation + ' (creature_id,' + relation_id + ',value) VALUES ',
                changed = false;

            // Loop through current attributes list
            for(var i in array) {

                // Loop through attributes in new wealth
                if(arrayAdd.length !== 0) {
                    for(var x in arrayAdd) {

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
                    for(var k in arraySubtract) {

                        // If IDs are matched, subtract from attributes list
                        if(array[i].id === arraySubtract[k].id) {
                            array[i].value = parseInt(array[i].value) - parseInt(arraySubtract[k].value);
                            array[i].changed = true;
                            arraySubtract[k].changed = true;
                        }
                    }
                }
            }

            for(var j in array) {
                if(array[j].changed === true) {
                    sql += '(' + id + ',' + array[j].id + ',' + array[j].value + '),';
                    changed = true;
                }
            }

            for(var n in arrayAdd) {
                if(arrayAdd[n].changed === false) {
                    sql += '(' + id + ',' + arrayAdd[n].id + ',' + arrayAdd[n].value + '),';
                    changed = true;
                }
            }

            for(var z in arraySubtract) {
                if(arraySubtract[z].changed === false) {
                    sql += '(' + id + ',' + arraySubtract[z].id + ',' + arraySubtract[z].value + '),';
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

function relationValuesEach(user, id, tableName, relationArray, additionId, subtractionId, callback) {
    if(!relationArray || relationArray.length === 0) return callback();

    async.each(relationArray, function(relationName, next) {
        relationValues(user, id, tableName, relationName, additionId, subtractionId, next);
    }, function(err) {
        callback(err);
    });
}

function equip(user, id, tableName, tableId, relationArray, boolean, callback) {
    id = parseInt(id);
    tableId = parseInt(tableId);
    boolean = !!parseInt(boolean);

    var creature_has_table = 'creature_has_' + tableName,
        table_id = tableName + '_id';

    var equipped;

    async.series([
        function(callback) {
            ownership(user, 'creature', id, callback);
        },
        function(callback) {
            query('SELECT equipped FROM ' + creature_has_table + ' WHERE creature_id = ? AND ' + table_id + ' = ?', [id, tableId], function(err, results) {
                if(err) return callback(err);

                equipped = !!results[0].equipped;

                callback();
            });
        },
        function(callback) {
            if((equipped && boolean) || (!equipped && !boolean)) return callback();

            var addId = boolean ? tableId : null,
                subId = boolean ? null : tableId;

            relationValuesEach(user, id, tableName, relationArray, addId, subId, callback);
        },
        function(callback) {
            if((equipped && boolean) || (!equipped && !boolean)) return callback();

            query('UPDATE ' + creature_has_table + ' SET equipped = ? WHERE creature_id = ? AND ' + table_id + ' = ?', [boolean, id, tableId], callback);
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
            tableText(id, 'appearance', appearance, callback);
        },
        function(callback) {
            tableText(id, 'age', age, callback);
        },
        function(callback) {
            tableText(id, 'biography', biography, callback);
        },
        function(callback) {
            tableText(id, 'description', description, callback);
        },
        function(callback) {
            tableText(id, 'drive', drive, callback);
        },
        function(callback) {
            tableText(id, 'gender', gender, callback);
        },
        function(callback) {
            tableText(id, 'occupation', occupation, callback);
        },
        function(callback) {
            tableText(id, 'personality', personality, callback);
        },
        function(callback) {
            tableText(id, 'pride', pride, callback);
        },
        function(callback) {
            tableText(id, 'problem', problem, callback);
        },
        function(callback) {
            tableText(id, 'shame', shame, callback);
        },

        function(callback) {
            tableId(id, 'corporation', corporationId, callback);
        },
        function(callback) {
            tableId(id, 'country', countryId, callback);
        },
        function(callback) {
            tableId(id, 'identity', identityId, callback);
        },
        function(callback) {
            tableId(id, 'nature', natureId, callback);
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
            tableId(id, 'wealth', wealthId, callback);
        }

    ], function(err) {
        callback(err);
    });
};


module.exports.assets = function(router) {
    var table = 'asset',
        array = ['attribute', 'doctrine', 'skill'],
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/assets')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id, req.body.value);
        });

    router.route('/:id/assets/:itemId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.value(req, res, next, 'creature', req.params.id, table, req.params.itemId, req.body.value);
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
                    query('DELETE FROM creature_has_asset WHERE creature_id = ? AND asset_id = ?', [req.params.id, req.params.itemId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/assets/:assetId/equip/:equip')
        .put(function(req, res, next) {
            equip(req.user, req.params.id, 'asset', req.params.assetId, array, req.params.equip, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.attributes = function(router) {
    var table = 'attribute',
        array = [],
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/attributes')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id, req.body.value);
        });

    router.route('/:id/attributes/:itemId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.value(req, res, next, 'creature', req.params.id, table, req.params.itemId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.augmentations = function(router) {}; //todo //bionic_id equipped

module.exports.backgrounds = function(router) {
    var table = 'background',
        array = ['asset', 'attribute', 'doctrine', 'skill', 'weapon'], //bionic
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/backgrounds')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
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
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.custom(req, res, next, 'creature', req.params.id, table, req.params.itemId, req.body.custom);
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

module.exports.bionics = function(router) {
    var table = 'bionic',
        array = ['attribute', 'skill'],
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/bionics')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
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
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
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

module.exports.doctrines = function(router) {
    var table = 'doctrine',
        array = [],
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/doctrines')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id, req.body.value);
        });

    router.route('/:id/doctrines/:itemId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.value(req, res, next, 'creature', req.params.id, table, req.params.itemId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.expertises = function(router) {}; //todo //value custom

module.exports.gifts = function(router) {
    var table = 'gift',
        array = ['attribute', 'skill'],
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/gifts')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
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
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.custom(req, res, next, 'creature', req.params.id, table, req.params.itemId, req.body.custom);
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
    var table = 'imperfection',
        array = ['attribute', 'skill'],
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/imperfections')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
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
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.custom(req, res, next, 'creature', req.params.id, table, req.params.itemId, req.body.custom);
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

module.exports.languages = function(router) {}; //todo //fluent

module.exports.manifestations = function(router) {}; //todo //focus

module.exports.milestones = function(router) {
    var table = 'milestone',
        array = ['asset', 'attribute', 'doctrine', 'skill', 'weapon'], //bionic //loyalty
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/milestones')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
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

    router.route('/:id/milestones/:itemId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.custom(req, res, next, 'creature', req.params.id, table, req.params.itemId, req.body.custom);
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

module.exports.protections = function(router) {}; //todo //equipped value custom

module.exports.relations = function(router) {}; //todo //loyalty_id milestone_id owner

module.exports.skills = function(router) {
    var table = 'skill',
        array = [],
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/skills')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id, req.body.value);
        });

    router.route('/:id/skills/:itemId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .put(function(req, res, next) {
            relation.value(req, res, next, 'creature', req.params.id, table, req.params.itemId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.species = function(router) {}; //todo //first custom

module.exports.software = function(router) {
    var table = 'software',
        array = [],
        sql = 'SELECT * FROM creature_has_' + table + ' LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/software')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, 'creature', req.params.id, table, req.body.insert_id, req.body.value);
        });

    router.route('/:id/software/:itemId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.' + table + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId], true);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, 'creature', req.params.id, table, req.params.itemId);
        });
};

module.exports.weapons = function(router) {}; //todo //equipped value custom

module.exports.weaponMods = function(router) {}; //todo //weapon_id


module.exports.dementations = function(router) {}; //todo //id creature_id dementation_id value healed

module.exports.diseases = function(router) {}; //todo //id creature_id disease_id value healed

module.exports.traumas = function(router) {}; //todo //id creature_id trauma_id value healed

