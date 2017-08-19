var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

var tables = require(appRoot + '/app/initializers/database').getTables();

function changeValues(tableName, personId, personList, relationList, currentList, callback) {
    if(!personList[0]) return callback();

    if((relationList === undefined || relationList === null || !relationList[0]) && (currentList === undefined || currentList === null || !currentList[0])) return callback();

    var call = 'INSERT INTO person_has_' + tableName + ' (person_id,' + tableName + '_id,value) VALUES ';

    // Begin by looping through personList, as we want to change existing relations, not add new
    for(var p in personList) {

        // If the Relation List exists and has at least one value
        if(relationList && relationList[0]) {

            // Loop through relationList
            for(var r in relationList) {

                // If person has the relation-col we wish to update = add the value
                if(personList[p].id === relationList[r].id) {
                    personList[p].value += relationList[r].value;
                    personList[p].changed = true;
                }
            }
        }

        // If the Current List exists and has at least one value
        if(currentList && currentList[0]) {

            // Loop through currentList
            for(var c in currentList) {

                // If person has the relation-col we wish to update = remove the value
                if(personList[p].id === currentList[c].id) {
                    personList[p].value -= currentList[c].value;
                    personList[p].changed = true;
                }
            }
        }

        // If the attribute has changed = add it to the call
        if(personList[p].changed === true) {
            call += '(' + personId + ',' + personList[p].id + ',' + personList[p].value + '),';
        }
    }

    call = call.slice(0, -1);

    call += ' ON DUPLICATE KEY UPDATE value = VALUES(value)';

    query(call, null, callback);
}

module.exports.changeValues = changeValues;

module.exports.changeEquip = function(req, personId, tableName, tableId, equipValue, callback) {
    personId = parseInt(personId);
    tableId = parseInt(tableId);

    var relationTables = [],
        table_Id = tableName + '_id',
        personHasTableName = 'person_has_' + tableName,
        alreadyEquipped;

    async.series([
        function(callback) {
            ownership(req, 'person', personId, false, callback);
        },
        function(callback) {
            query('SELECT equipped FROM ' + personHasTableName + ' WHERE person_id = ? AND ' + table_Id + ' = ?', [personId, tableId], function(err, results) {
                if(err) return callback(err);

                alreadyEquipped = !!results[0].equipped;

                callback();
            });
        },
        function(callback) {
            if(equipValue === 1 && alreadyEquipped) return callback();
            if(equipValue === 0 && !alreadyEquipped) return callback();

            var compareName = tableName + '_has_';

            // Walk through the full list of tables in the database
            for(var i in tables) {
                var actualName = tables[i];

                // If the table has a relationship (table_has_relationship) that is not comment, add it to the list
                if(actualName.indexOf(compareName) !== -1 && actualName.indexOf('_comment') === -1) {
                    relationTables.push(actualName);
                }
            }

            callback();
        },
        function(callback) {
            if(equipValue === 1 && alreadyEquipped) return callback();
            if(equipValue === 0 && !alreadyEquipped) return callback();

            if(relationTables.length === 0) return callback();

            // For each relation table the table has... set a relation table name (ex: asset_has_attribute)
            async.each(relationTables, function(relationHasTableName, next) {

                // Set the relation name (ex: attribute)
                var relationName = relationHasTableName.split("_has_")[1];

                // Set the relation_id (ex: attribute_id)
                var relation_Id = relationName + '_id';

                // Set the person_has_relation (ex: person_has_attribute)
                var personHasRelationName = 'person_has_' + relationName;

                // Create the objects needed for the function changeValues
                var person = {},
                    change = {};

                // Walk through the list and do the following
                async.series([
                    function(callback) {
                        // Select a persons current values
                        query('SELECT ' + relation_Id + ' AS id, value FROM ' + personHasRelationName + ' WHERE person_id = ?', [personId], function(err, results) {
                            if(err) return callback(err);

                            person.array = results;

                            callback();
                        });
                    },
                    function(callback) {
                        // Select the table current relation values
                        query('SELECT ' + relation_Id + ' AS id, value FROM ' + relationHasTableName + ' WHERE ' + table_Id + ' = ?', [tableId], function(err, results) {
                            if(err) return callback(err);

                            change.array = results;

                            callback();
                        });
                    },
                    function(callback) {
                        if(equipValue === 0) return callback();

                        // Insert the new values into the person
                        changeValues(relationName, personId, person.array, change.array, null, callback);
                    },
                    function(callback) {
                        if(equipValue === 1) return callback();

                        // Remove the values from the person
                        changeValues(relationName, personId, person.array, null, change.array, callback);
                    }
                ],function(err) {
                    next(err);
                });
            }, function(err) {
                callback(err);
            })
        },
        function(callback) {
            if(equipValue === 1 && alreadyEquipped) return callback();
            if(equipValue === 0 && !alreadyEquipped) return callback();

            query('UPDATE ' + personHasTableName + ' SET equipped = ? WHERE person_id = ? AND ' + table_Id + ' = ?', [equipValue, personId, tableId], callback);
        }
    ], function(err) {
        callback(err);
    });
};

module.exports.changeActivate = function(req, personId, augmentationId, bionicId, activeValue, callback) {
    personId = parseInt(personId);
    augmentationId = parseInt(augmentationId);
    bionicId = parseInt(bionicId);

    var weaponId,
        alreadyActive,
        alreadyWeapon;

    var personArray,
        changeArray;

    async.series([
        function(callback) {
            ownership(req, 'person', personId, false, callback);
        },
        function(callback) {
            query('SELECT active FROM person_has_augmentation WHERE person_id = ? AND bionic_id = ? AND augmentation_id = ?', [personId, bionicId, augmentationId], function(err, results) {
                if(err) return callback(err);

                alreadyActive = !!results[0].active;

                callback();
            });
        },
        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();

            query('UPDATE person_has_augmentation SET active = ? WHERE person_id = ? AND bionic_id = ? AND augmentation_id = ?', [activeValue, personId, bionicId, augmentationId], callback);
        },

        // ATTRIBUTE

        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();

            query('SELECT attribute_id AS id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, results) {
                if(err) return callback(err);

                personArray = results;

                callback();
            });
        },
        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();

            query('SELECT attribute_id AS id, value FROM augmentation_has_attribute WHERE augmentation_id = ?', [augmentationId], function(err, results) {
                if(err) return callback(err);

                changeArray = results;

                callback();
            });
        },
        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0) return callback();

            // Insert the new values into the person
            changeValues('attribute', personId, personArray, changeArray, null, callback);
        },
        function(callback) {
            if(activeValue === 1) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();

            // Remove the values from the person
            changeValues('attribute', personId, personArray, null, changeArray, callback);
        },

        // SKILL

        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();

            query('SELECT skill_id AS id, value FROM person_has_skill WHERE person_id = ?', [personId], function(err, results) {
                if(err) return callback(err);

                personArray = results;

                callback();
            });
        },
        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();

            query('SELECT skill_id AS id, value FROM augmentation_has_skill WHERE augmentation_id = ?', [augmentationId], function(err, results) {
                if(err) return callback(err);

                changeArray = results;

                callback();
            });
        },
        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0) return callback();

            // Insert the new values into the person
            changeValues('skill', personId, personArray, changeArray, null, callback);
        },
        function(callback) {
            if(activeValue === 1) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();

            // Remove the values from the person
            changeValues('skill', personId, personArray, null, changeArray, callback);
        },

        // WEAPON
        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();

            query('SELECT weapon_id FROM augmentation WHERE id = ?', [augmentationId], function(err, results) {
                if(err) return callback(err);

                weaponId = results[0].weapon_id;

                callback();
            });
        },
        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();
            if(!weaponId) return callback();

            query('SELECT weapon_id FROM person_has_weapon WHERE person_id = ? AND weapon_id = ?', [personId, weaponId], function(err, results) {
                if(err) return callback(err);

                alreadyWeapon = !!results[0];

                callback();
            });
        },
        function(callback) {
            if(activeValue === 1 && alreadyActive) return callback();
            if(activeValue === 0) return callback();
            if(!weaponId) return callback();
            if(alreadyWeapon) return callback();

            query('INSERT INTO person_has_weapon (person_id,weapon_id) VALUES (?,?)', [personId, weaponId], callback);
        },
        function(callback) {
            if(activeValue === 1) return callback();
            if(activeValue === 0 && !alreadyActive) return callback();
            if(!weaponId) return callback();
            if(alreadyWeapon) return callback();

            query('DELETE FROM person_has_weapon WHERE person_id = ? AND weapon_id = ?', [personId, weaponId], callback);
        }
    ], function(err) {
        callback(err);
    });
};

module.exports.changeCustom = function(req, res, next, personId, relationName, relationId, relationCustom) {
    var personHasRelation = 'person_has_' + relationName,
        relation_Id = relationName + '_id';

    async.series([
        function(callback) {
            ownership(req, relationName, personId, false, callback);
        },
        function(callback) {
            query('UPDATE ' + personHasRelation + ' SET custom = ? WHERE person_id = ? AND ' + relation_Id + ' = ?', [relationCustom, personId, relationId], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(200).send();
    });
};

module.exports.changePoint = function(req, personId, pointName, changeValue, callback) {
    personId = parseInt(personId);

    var colName = 'point_' + pointName,
        colChange;

    async.series([
        function(callback) {
            ownership(req, 'person', personId, false, callback);
        },
        function(callback) {
            query('SELECT ' + colName + ' FROM person_creation WHERE person_id = ?', [personId], function(err, results) {
                if(err) return callback(err);

                colChange = results[0][colName] + changeValue;

                callback();
            });
        },
        function(callback) {
            query('UPDATE person_creation SET ' + colName + ' = ? WHERE person_id = ?', [colChange, personId], callback);
        }
    ], function(err) {
        callback(err);
    })
};