var async = require('async');

var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    query = require('./../../lib/sql/query'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'person',
        adminRestriction = false;

    // Functions

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

    function customDescription(req, personId, tableName, tableId, tableCustom, callback) {
        async.series([
            function(callback) {
                ownership(req, tableName, personId, adminRestriction, callback);
            },
            function(callback) {
                query('UPDATE person_has_' + tableName + ' SET custom = ? WHERE person_id = ? AND ' + tableName + '_id = ?', [tableCustom, personId, tableId], callback);
            }
        ],function(err) {
            callback(err);
        });
    }

    // SQL

    var sql = 'SELECT * FROM person ' +
        'LEFT JOIN person_playable ON person_playable.person_id = person.id ' +
        'LEFT JOIN person_description ON person_description.person_id = person.id ' +
        'LEFT JOIN person_creation ON person_creation.person_id = person.id ' +
        'LEFT JOIN person_has_species ON (person_has_species.person_id = person.id AND person_has_species.first = 1)';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'identity.canon = 1 AND ' +
                'identity.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var person = {},
                insert = {},
                world = {},
                species = {},
                points = {};

            insert.playable = parseInt(req.body.playable) || 1;
            insert.supernatural = parseInt(req.body.supernatural) || 0;
            insert.nickname = req.body.nickname;
            insert.age = parseInt(req.body.age);
            insert.occupation = req.body.occupation;

            species.id = parseInt(req.body.species_id);

            world.id = parseInt(req.body.world_id);

            async.series([
                function(callback) {
                    query('SELECT * FROM world WHERE id = ?', [world.id], function(err, results) {
                        if(err) return callback(err);

                        world.select = results[0];

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT attribute_id, value FROM world_has_attribute WHERE world_id = ?', [world.id], function(err, results) {
                        if(err) return callback(err);

                        world.attribute = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT skill_id AS id FROM world_has_skill WHERE world_id = ?', [world.id], function(err, results) {
                        if(err) return callback(err);

                        world.skill = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT * FROM species WHERE id = ?', [species.id], function(err, results) {
                        if(err) return callback(err);

                        species.select = results[0];

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT attribute_id, value FROM species_has_attribute WHERE species_id = ?', [species.id], function(err, results) {
                        if(err) return callback(err);

                        species.attribute = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT id FROM skill WHERE species_id = ?', [species.id], function(err, results) {
                        if(err) return callback(err);

                        species.skill = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT weapon_id AS id FROM species_has_weapon WHERE species_id = ?', [species.id], function(err, results) {
                        if(err) return callback(err);

                        species.weapon = results;

                        callback();
                    });
                },
                function(callback) {
                    points.expertise = 1;
                    points.gift = world.select.max_gift;
                    points.imperfection = world.select.max_imperfection;
                    points.milestone = 1;
                    points.money = 1;
                    points.power = 1;
                    points.relationship = 1;
                    points.skill = 1;
                    points.doctrine = 1;
                    points.doctrine_expertise = 1;

                    var split = {},
                        max = {};

                    // Calculate split value based on person age and world settings
                    split.expertise = Math.floor(insert.age / (world.select.split_expertise * species.select.multiply_expertise));
                    split.milestone = Math.floor(insert.age / world.select.split_milestone);
                    split.relationship = Math.floor(insert.age / world.select.split_relationship);
                    split.skill = Math.floor(insert.age / (world.select.split_skill * species.select.multiply_skill));
                    split.doctrine = Math.floor(insert.age / world.select.split_doctrine);

                    max.expertise = world.select.max_expertise;
                    max.milestone = world.select.max_milestone;
                    max.relationship = world.select.max_relationship;
                    max.skill = world.select.max_skill;
                    max.doctrine = world.select.max_doctrine;

                    // If the split value is lower than maximum, and higher than 1
                    // If the split value is higher than maximum
                    if (split.expertise < max.expertise && split.expertise > 1) {
                        points.expertise = split.expertise;
                    } else if (split.expertise > max.expertise) {
                        points.expertise = max.expertise;
                    }

                    if (split.milestone < max.milestone && split.milestone > 1) {
                        points.milestone = split.milestone;
                    } else if (split.milestone > max.milestone) {
                        points.milestone = max.milestone;
                    }

                    if (split.relationship < max.relationship && split.relationship > 1) {
                        points.relationship = split.relationship;
                    } else if (split.relationship > max.relationship) {
                        points.relationship = max.relationship;
                    }

                    if (split.skill < max.skill && split.skill > 1) {
                        points.skill = split.skill;
                    } else if (split.skill > max.skill) {
                        points.skill = max.skill;
                    }

                    if (split.doctrine < max.doctrine && split.doctrine > 1) {
                        points.doctrine = split.doctrine;
                    } else if (split.doctrine > max.doctrine) {
                        points.doctrine = max.doctrine;
                    }

                    callback();
                },
                function(callback) {
                    query('INSERT INTO person (playable,nickname,occupation,world_id) VALUES (?,?,?,?)', [insert.playable, insert.nickname, insert.occupation, world.id], function(err, result) {
                        if(err) return callback(err);

                        person.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO person_playable (person_id, supernatural, age) VALUES (?,?,?)', [person.id, insert.supernatural, insert.age], callback);
                },
                function(callback) {
                    query('INSERT INTO person_description (person_id) VALUES (?)', [person.id], callback);
                },
                function(callback) {
                    query('INSERT INTO person_has_species (person_id, species_id, first) VALUES (?,?,?)', [person.id, species.id, 1], callback);
                },
                function(callback) {
                    query('INSERT INTO person_creation (person_id,point_expertise,point_gift,point_imperfection,' +
                        'point_milestone,point_money,point_power,point_relationship,point_skill,point_doctrine) VALUES (?,?,?,?,?,?,?,?,?,?)',
                        [person.id, points.expertise, points.gift, points.imperfection, points.milestone, points.money, points.power,
                            points.relationship, points.skill, points.doctrine], callback);
                },
                function(callback) {
                    var call = 'INSERT INTO person_has_attribute (person_id,attribute_id,value) VALUES ';

                    // Loop through attribute list from world
                    for(var i in world.attribute) {

                        // If species has a list of attributes
                        if(species.attribute !== undefined && species.attribute[0] !== undefined) {

                            // Loop through species list of attributes
                            for(var j in species.attribute) {

                                // If species has attribute in world list = update values and save updated status in species attribute
                                if(world.attribute[i].attribute_id === species.attribute[j].attribute_id) {
                                    world.attribute[i].value += species.attribute[j].value;
                                    species.attribute[j].updated = true;
                                }
                            }
                        }

                        // Add the attribute and (perhaps updated) value to the call
                        call += '(' + person.id + ',' + world.attribute[i].attribute_id + ',' + world.attribute[i].value + '),';
                    }

                    // If species has a list of attributes
                    if(species.attribute !== undefined && species.attribute[0] !== undefined) {

                        // Loop through species list of attributes
                        for (var m in species.attribute) {

                            // If species attribute was not added to world call = it is species specific attribute
                            if (species.attribute[m].updated !== true) {
                                call += '(' + person.id + ',' + species.attribute[m].attribute_id + ',' + species.attribute[m].value + '),';
                            }
                        }
                    }

                    call = call.slice(0, -1);

                    query(call, null, callback);
                },
                function(callback) {
                    var call = 'INSERT INTO person_has_skill (person_id,skill_id,value) VALUES ';

                    // Loop through skill list from world
                    for(var i in world.skill) {

                        // Add skill to call
                        call += '(' + person.id + ',' + world.skill[i].id + ',0),';
                    }

                    // If species has a list of skills
                    if(species.skill !== undefined && species.skill[0] !== undefined) {

                        // Loop through species list of skills
                        for (var m in species.skill) {

                            // Add skill to call
                            call += '(' + person.id + ',' + species.skill[m].id + ',0),';
                        }
                    }

                    call = call.slice(0, -1);

                    query(call, null, callback);
                },
                function(callback) {
                    if(species.weapon[0] === undefined) return callback();

                    var call = 'INSERT INTO person_has_weapon (person_id,weapon_id,species) VALUES ';

                    // Loop through species list of weapons
                    for(var i in species.weapon) {

                        console.log(species.weapon[i]);
                        // Add weapon to call
                        call += '(' + person.id + ',' + species.weapon[i].id + ',1),';
                    }

                    call = call.slice(0, -1);

                    query(call, null, callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_person (user_id,person_id,owner) VALUES (?,?,1)', [req.user.id, person.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: person.id});
            });
        });

    // ID

    router.route('/:personId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE identity.id = ? AND identity.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.personId], true);
        })
        .put(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var person = {},
                body = res.body;

            person.id = parseInt(req.params.personId);

            var updatePerson = [
                'playable',
                'calculated',
                'nickname',
                'occupation'
            ];

            var updateCreation = [
                'point_expertise',
                'point_gift',
                'point_imperfection',
                'point_milestone',
                'point_money',
                'point_power',
                'point_relationship',
                'point_skill',
                'point_doctrine'
            ];

            var updatePlayable = [
                'supernatural',
                'age',
                'country_id',
                'focus_id',
                'identity_id',
                'nature_id'
            ];

            var updateDescription = [
                'firstname',
                'surname',
                'gender',
                'description',
                'personality',
                'appearance',
                'background',
                'drive',
                'pride',
                'problem',
                'shame',
                'picture_path'
            ];

            async.series([
                function(callback) {
                    ownership(req, 'person', person.id, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT playable,calculated FROM person WHERE id = ?', [person.id], function(err, result) {
                        if(err) return callback(err);

                        person.playable = !!result[0].playable;
                        person.calculated = !!result[0].calculated;

                        callback();
                    });
                },
                function(callback) {
                    var call = 'UPDATE person SET ',
                        values_array = [],
                        query_amount = 0;

                    for(var key in body) {
                        if(body.hasOwnProperty(key) && body[key] !== '') {
                            if(updatePerson.indexOf(key) === -1) continue;

                            call += key + ' = ?, ';
                            values_array.push(body[key]);
                            query_amount++;
                        }
                    }

                    if(query_amount === 0) return callback();

                    call = call.slice(0, -2) + ', updated = CURRENT_TIMESTAMP WHERE id = ?';
                    values_array.push(person.id);

                    query(call, values_array, callback);
                },
                function(callback) {
                    if(!person.playable || person.calculated) return callback();

                    var call = 'UPDATE person_creation SET ',
                        values_array = [],
                        query_amount = 0;

                    for(var key in body) {
                        if(body.hasOwnProperty(key) && body[key] !== '') {
                            if(updateCreation.indexOf(key) === -1) continue;

                            call += key + ' = ?, ';
                            values_array.push(body[key]);
                            query_amount++;
                        }
                    }

                    if(query_amount === 0) return callback();

                    call = call.slice(0, -2) + ' WHERE person_id = ?';
                    values_array.push(person.id);

                    query(call, values_array, callback);
                },
                function(callback) {
                    if(!person.playable) return callback();

                    var call = 'UPDATE person_playable SET ',
                        values_array = [],
                        query_amount = 0;

                    for(var key in body) {
                        if(body.hasOwnProperty(key) && body[key] !== '') {
                            if(updatePlayable.indexOf(key) === -1) continue;

                            call += key + ' = ?, ';
                            values_array.push(body[key]);
                            query_amount++;
                        }
                    }

                    if(query_amount === 0) return callback();

                    call = call.slice(0, -2) + ' WHERE person_id = ?';
                    values_array.push(person.id);

                    query(call, values_array, callback);
                },
                function(callback) {
                    var call = 'UPDATE person_description SET ',
                        values_array = [],
                        query_amount = 0;

                    for(var key in body) {
                        if(body.hasOwnProperty(key) && body[key] !== '') {
                            if(updateDescription.indexOf(key) === -1) continue;

                            call += key + ' = ?, ';
                            values_array.push(body[key]);
                            query_amount++;
                        }
                    }

                    if(query_amount === 0) return callback();

                    call = call.slice(0, -2) + ' WHERE person_id = ?';
                    values_array.push(person.id);

                    query(call, values_array, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send();
            });
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.personId, adminRestriction);
        });

    // Background

    router.route('/:personId/background')
        .put(function(req, res, next) {
            var person = {},
                insert = {},
                current = {};

            person.id = parseInt(req.params.personId);
            insert.id = parseInt(req.body.insert_id);

            async.series([
                function(callback) {
                    ownership(req, tableName, person.id, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT background_id FROM person_playable WHERE person_id = ?', [person.id], function(err, result) {
                        if(err) return callback(err);

                        current.id = result[0].background_id;

                        callback();
                    });
                },
                function(callback) {
                    if(insert.id === current.id) return callback();

                    query('UPDATE person_playable SET background_id = ? WHERE person_id = ?', [insert.id, person.id], callback);
                },

                // ATTRIBUTE

                function(callback) {
                    query('SELECT attribute_id AS id, value FROM person_has_attribute WHERE person_id = ?', [person.id], function(err, result) {
                        if(err) return callback(err);

                        person.attribute = result;

                        callback()
                    });
                },
                function(callback) {
                    query('SELECT attribute_id AS id, value FROM background_has_attribute WHERE background_id = ?', [insert.id], function(err, result) {
                        if(err) return callback(err);

                        insert.attribute = result;

                        callback()
                    });
                },
                function(callback) {
                    if(!current.id) return callback();

                    query('SELECT attribute_id AS id, value FROM background_has_attribute WHERE background_id = ?', [current.id], function(err, result) {
                        if(err) return callback(err);

                        current.attribute = result;

                        callback();
                    });
                },
                function(callback) {
                    if(insert.id === current.id) return callback();

                    changeValues('attribute', person.id, person.attribute, insert.attribute, current.attribute, callback);
                },

                // SKILL

                function(callback) {
                    query('SELECT skill_id AS id, value FROM person_has_skill WHERE person_id = ?', [person.id], function(err, result) {
                        if(err) return callback(err);

                        person.skill = result;

                        callback()
                    });
                },
                function(callback) {
                    query('SELECT skill_id AS id, value FROM background_has_skill WHERE background_id = ?', [insert.id], function(err, result) {
                        if(err) return callback(err);

                        insert.skill = result;

                        callback()
                    });
                },
                function(callback) {
                    if(!current.id) return callback();

                    query('SELECT skill_id AS id, value FROM background_has_skill WHERE background_id = ?', [current.id], function(err, result) {
                        if(err) return callback(err);

                        current.skill = result;

                        callback();
                    });
                },
                function(callback) {
                    if(insert.id === current.id) return callback();

                    changeValues('skill', person.id, person.skill, insert.skill, current.skill, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send();
            });
        });

    // Cheating

    router.route('/:personId/cheat')
        .put(function(req, res, next) {
            var person = {};

            person.id = parseInt(req.params.personId);

            async.series([
                function(callback) {
                    ownership(req, tableName, person.id, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT playable,calculated FROM person WHERE id = ?', [person.id], function(err, result) {
                        if(err) return callback(err);

                        person.playable = !!result[0];
                        person.calculated = !!result[0];

                        callback();
                    });
                },
                function(callback) {
                    query('UPDATE person SET popularity = 0 WHERE id = ?', [person.id], callback);
                },
                function(callback) {
                    query('UPDATE person_playable SET cheated = 1 WHERE person_id = ?', [person.id], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send();
            });
        });

    // Comments

    router.route('/:personId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.personId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.personId);
        });

    // Manifestation

    router.route('/:personId/manifestation')
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var person = {},
                manifestation = {},
                insert = {};

            person.id = parseInt(req.params.personId);
            insert.id = parseInt(req.body.insert_id);

            async.series([
                function(callback) {
                    ownership(req, tableName, person.id, adminRestriction, callback);
                },
                function(callback) {
                    query('UPDATE person_playable SET manifestation_id = ? WHERE person_id = ?', [insert.id, person.id], callback);
                },
                function(callback) {
                    query('SELECT power_id, skill_id FROM manifestation WHERE id = ?', [insert.id], function(err, result) {
                        if(err) return callback(err);

                        manifestation.power = result[0].power_id;
                        manifestation.skill = result[0].skill_id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO person_has_attribute (person_id,attribute_id,value) VALUES (?,?,0) ON DUPLICATE KEY UPDATE value = VALUES(value)', [person.id, manifestation.power], callback)
                },
                function(callback) {
                    query('INSERT INTO person_has_skill (person_id,skill_id,value) VALUES (?,?,0) ON DUPLICATE KEY UPDATE value = VALUES(value)', [person.id, manifestation.skill], callback)
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send();
            });
        });

    // Ownership

    router.route('/:personId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.personId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};
