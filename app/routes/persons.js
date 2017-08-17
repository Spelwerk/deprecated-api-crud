var async = require('async');

var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    query = require('./../../lib/sql/query'),
    person = require('./../../lib/sql/person'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'person',
        adminRestriction = false;

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

            var insert = {},
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

                        insert.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO person_playable (person_id, supernatural, age) VALUES (?,?,?)', [insert.id, insert.supernatural, insert.age], callback);
                },
                function(callback) {
                    query('INSERT INTO person_description (person_id) VALUES (?)', [insert.id], callback);
                },
                function(callback) {
                    query('INSERT INTO person_has_species (person_id, species_id, first) VALUES (?,?,?)', [insert.id, species.id, 1], callback);
                },
                function(callback) {
                    query('INSERT INTO person_creation (person_id,point_expertise,point_gift,point_imperfection,' +
                        'point_milestone,point_money,point_power,point_relationship,point_skill,point_doctrine) VALUES (?,?,?,?,?,?,?,?,?,?)',
                        [insert.id, points.expertise, points.gift, points.imperfection, points.milestone, points.money, points.power,
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
                        call += '(' + insert.id + ',' + world.attribute[i].attribute_id + ',' + world.attribute[i].value + '),';
                    }

                    // If species has a list of attributes
                    if(species.attribute !== undefined && species.attribute[0] !== undefined) {

                        // Loop through species list of attributes
                        for (var m in species.attribute) {

                            // If species attribute was not added to world call = it is species specific attribute
                            if (species.attribute[m].updated !== true) {
                                call += '(' + insert.id + ',' + species.attribute[m].attribute_id + ',' + species.attribute[m].value + '),';
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
                        call += '(' + insert.id + ',' + world.skill[i].id + ',0),';
                    }

                    // If species has a list of skills
                    if(species.skill !== undefined && species.skill[0] !== undefined) {

                        // Loop through species list of skills
                        for (var m in species.skill) {

                            // Add skill to call
                            call += '(' + insert.id + ',' + species.skill[m].id + ',0),';
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
                        call += '(' + insert.id + ',' + species.weapon[i].id + ',1),';
                    }

                    call = call.slice(0, -1);

                    query(call, null, callback);
                },
                function(callback) {
                    query('INSERT INTO user_has_person (user_id,person_id,owner) VALUES (?,?,1)', [req.user.id, insert.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: insert.id});
            });
        });

    // ID

    router.route('/:personId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE identity.id = ? AND identity.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.personId], true);
        })
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                body = res.body,
                playable,
                calculated;

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
                    ownership(req, 'person', personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT playable,calculated FROM person WHERE id = ?', [personId], function(err, result) {
                        if(err) return callback(err);

                        playable = !!result[0].playable;
                        calculated = !!result[0].calculated;

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
                    values_array.push(personId);

                    query(call, values_array, callback);
                },
                function(callback) {
                    if(!playable || calculated) return callback();

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
                    values_array.push(personId);

                    query(call, values_array, callback);
                },
                function(callback) {
                    if(!playable) return callback();

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
                    values_array.push(personId);

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
                    values_array.push(personId);

                    query(call, values_array, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.personId, adminRestriction);
        });

    // Assets

    router.route('/:personId/assets')
        .get(function(req, res, next) {
            var call = 'SELECT ' +
                'asset.id, ' +
                'asset.canon, ' +
                'asset.popularity, ' +
                'asset.name, ' +
                'asset.description, ' +
                'asset.price, ' +
                'asset.legal, ' +
                'asset.assettype_id, ' +
                'assettype.name AS assettype_name, ' +
                'assettype.icon, ' +
                'assettype.assetgroup_id, ' +
                'assetgroup.name, ' +
                'person_has_asset.value, ' +
                'person_has_asset.custom, ' +
                'person_has_asset.equipped ' +
                'FROM person_has_asset ' +
                'LEFT JOIN asset ON asset.id = person_has_asset.asset_id ' +
                'LEFT JOIN assettype ON assettype.id = asset.assettype_id ' +
                'LEFT JOIN assetgroup ON assetgroup.id = assettype.assetgroup_id ' +
                'WHERE ' +
                'person_has_asset.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.personId, 'asset', req.body.insert_id, req.body.value);
        });

    router.route('/:personId/assets/:assetId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.personId, 'asset', req.params.assetId, req.body.value);
        })
        .delete(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                removeId = parseInt(req.params.assetId);

            async.each([
                function(callback) {
                    ownership(req, 'person', personId, adminRestriction, callback);
                },
                function(callback) {
                    person.changeEquip(personId, 'asset', removeId, 0, callback);
                },
                function(callback) {
                    query('DELETE FROM person_has_asset WHERE person_id = ? AND asset_id = ?', [personId, removeId], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/assets/:assetId/equip')
        .put(function(req, res, next) {
            person.changeEquip(req.params.personId, 'asset', req.params.assetId, 1, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/assets/:assetId/unequip')
        .put(function(req, res, next) {
            person.changeEquip(req.params.personId, 'asset', req.params.assetId, 0, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Attributes

    // Augmentations

    router.route('/:personId/augmentations')
        .get(function(req, res, next) {
            var call = 'SELECT ' +
                'augmentation.id, ' +
                'augmentation.canon, ' +
                'augmentation.popularity, ' +
                'augmentation.name, ' +
                'augmentation.description, ' +
                'augmentation.price, ' +
                'augmentation.legal, ' +
                'augmentation.weapon_id, ' +
                'person_has_augmentation.active ' +
                'FROM person_has_augmentation ' +
                'LEFT JOIN augmentation ON augmentation.id = person_has_augmentation.augmentation_id ' +
                'WHERE ' +
                'person_has_augmentation.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                augmentationId = parseInt(req.body.insert_id),
                bionicId = parseInt(req.body.bionic_id);

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('INSERT INTO person_has_augmentation (person_id,bionic_id,augmentation_id) VALUES (?,?,?)', [personId, bionicId, augmentationId], callback);
                },
                function(callback) {
                    person.changeActivate(personId, augmentationId, bionicId, 1, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:personId/augmentations/bionic/:bionicId')
        .get(function(req, res, next) {
            var call = 'SELECT ' +
                'augmentation.id, ' +
                'augmentation.canon, ' +
                'augmentation.popularity, ' +
                'augmentation.name, ' +
                'augmentation.description, ' +
                'augmentation.price, ' +
                'augmentation.legal, ' +
                'augmentation.weapon_id, ' +
                'person_has_augmentation.active ' +
                'FROM person_has_augmentation ' +
                'LEFT JOIN augmentation ON augmentation.id = person_has_augmentation.augmentation_id ' +
                'WHERE ' +
                'person_has_augmentation.person_id = ? AND ' +
                'person_has_augmentation.bionic_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.bionicId]);
        });

    router.route('/:personId/augmentations/:augmentationId/bionic/:bionicId')
        .delete(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                augmentationId = parseInt(req.params.augmentationId),
                bionicId = parseInt(req.params.bionicId);

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    person.changeActivate(personId, augmentationId, bionicId, 0, callback);
                },
                function(callback) {
                    query('DELETE FROM person_has_augmentation WHERE person_id = ? AND augmentation_id = ? AND bionic_id = ?', [personId, augmentationId, bionicId], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/augmentations/:augmentationId/bionic/:bionicId/activate')
        .put(function(req, res, next) {
            person.changeActivate(req.params.personId, req.params.augmentationId, req.params.bionicId, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/augmentations/:augmentationId/bionic/:bionicId/deactivate')
        .put(function(req, res, next) {
            person.changeActivate(req.params.personId, req.params.augmentationId, req.params.bionicId, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Background

    router.route('/:personId/background')
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                backgroundId = parseInt(req.body.insert_id),
                currentId;

            var personArray,
                backgroundArray,
                currentArray;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT background_id FROM person_playable WHERE person_id = ?', [personId], function(err, result) {
                        if(err) return callback(err);

                        currentId = result[0].background_id;

                        callback();
                    });
                },
                function(callback) {
                    if(backgroundId === currentId) return callback();

                    query('UPDATE person_playable SET background_id = ? WHERE person_id = ?', [backgroundId, personId], callback);
                },

                // ATTRIBUTE

                function(callback) {
                    if(backgroundId === currentId) return callback();

                    query('SELECT attribute_id AS id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, result) {
                        if(err) return callback(err);

                        personArray = result;

                        callback()
                    });
                },
                function(callback) {
                    if(backgroundId === currentId) return callback();

                    query('SELECT attribute_id AS id, value FROM background_has_attribute WHERE background_id = ?', [backgroundId], function(err, result) {
                        if(err) return callback(err);

                        backgroundArray = result;

                        callback()
                    });
                },
                function(callback) {
                    if(!currentId) return callback();

                    query('SELECT attribute_id AS id, value FROM background_has_attribute WHERE background_id = ?', [currentId], function(err, result) {
                        if(err) return callback(err);

                        currentArray = result;

                        callback();
                    });
                },
                function(callback) {
                    if(backgroundId === currentId) return callback();

                    person.changeValues('attribute', personId, personArray, backgroundArray, currentArray, callback);
                },

                // SKILL

                function(callback) {
                    if(backgroundId === currentId) return callback();

                    query('SELECT skill_id AS id, value FROM person_has_skill WHERE person_id = ?', [personId], function(err, result) {
                        if(err) return callback(err);

                        personArray = result;

                        callback()
                    });
                },
                function(callback) {
                    if(backgroundId === currentId) return callback();

                    query('SELECT skill_id AS id, value FROM background_has_skill WHERE background_id = ?', [backgroundId], function(err, result) {
                        if(err) return callback(err);

                        backgroundArray = result;

                        callback()
                    });
                },
                function(callback) {
                    if(!currentId) return callback();

                    query('SELECT skill_id AS id, value FROM background_has_skill WHERE background_id = ?', [currentId], function(err, result) {
                        if(err) return callback(err);

                        currentArray = result;

                        callback();
                    });
                },
                function(callback) {
                    if(backgroundId === currentId) return callback();

                    person.changeValues('skill', personId, personArray, backgroundArray, currentArray, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Bionics

    router.route('/:personId/bionics')
        .get(function(req, res, next) {
            var call = 'SELECT ' +
                'bionic.id, ' +
                'bionic.canon, ' +
                'bionic.popularity, ' +
                'bionic.name, ' +
                'bionic.description, ' +
                'bionic.price, ' +
                'bionic.legal, ' +
                'bionic.bodypart_id, ' +
                'bionic.icon, ' +
                'person_has_bionic.custom ' +
                'FROM person_has_bionic ' +
                'LEFT JOIN bionic ON bionic.id = person_has_bionic.bionic_id ' +
                'WHERE ' +
                'person_has_bionic.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                bionicId = parseInt(req.body.insert_id);

            var personArray,
                bionicArray;

            async.series([
                function(callback) {
                    ownership(req, 'person', personId, adminRestriction, callback);
                },
                function(callback) {
                    query('INSERT INTO person_has_bionic (person_id,bionic_id) VALUES (?,?)', [personId, bionicId], callback);
                },
                function(callback) {
                    query('SELECT attribute_id AS id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback(err);
                    });
                },
                function(callback) {
                    query('SELECT attribute_id AS id, value FROM bionic_has_attribute WHERE bionic_id = ?', [bionicId], function(err, results) {
                        if(err) return callback(err);

                        bionicArray = results;

                        callback(err);
                    });
                },
                function(callback) {
                    person.changeValues('attribute', personId, personArray, bionicArray, null, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/bionics/:bionicId')
        .delete(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                bionicId = parseInt(req.params.bionicId);

            var personArray,
                bionicArray;

            async.series([
                function(callback) {
                    ownership(req, 'person', personId, adminRestriction, callback);
                },
                function(callback) {
                    //todo remove all augmentations and deactivate them
                },
                function(callback) {
                    query('SELECT attribute_id AS id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback(err);
                    });
                },
                function(callback) {
                    query('SELECT attribute_id AS id, value FROM bionic_has_attribute WHERE bionic_id = ?', [bionicId], function(err, results) {
                        if(err) return callback(err);

                        bionicArray = results;

                        callback(err);
                    });
                },
                function(callback) {
                    person.changeValues('attribute', personId, personArray, null, bionicArray, callback);
                },
                function(callback) {
                    query('DELETE FROM person_has_bionic WHERE person_id = ? AND bionic_id = ?', [personId, bionicId], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Cheating

    router.route('/:personId/cheat')
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                playable,
                calculated;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT playable,calculated FROM person WHERE id = ?', [personId], function(err, result) {
                        if(err) return callback(err);

                        playable = !!result[0];
                        calculated = !!result[0];

                        callback();
                    });
                },
                function(callback) {
                    query('UPDATE person SET popularity = 0 WHERE id = ?', [personId], callback);
                },
                function(callback) {
                    query('UPDATE person_playable SET cheated = 1 WHERE person_id = ?', [personId], callback);
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

    // Diseases

    // Doctrines

    // Expertises

    // Gifts

    // Imperfections

    // Manifestation

    router.route('/:personId/manifestation')
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                manifestationId = parseInt(req.body.insert_id),
                powerId,
                skillId;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('UPDATE person_playable SET manifestation_id = ? WHERE person_id = ?', [manifestationId, personId], callback);
                },
                function(callback) {
                    query('SELECT power_id, skill_id FROM manifestation WHERE id = ?', [manifestationId], function(err, result) {
                        if(err) return callback(err);

                        powerId = result[0].power_id;
                        skillId = result[0].skill_id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO person_has_attribute (person_id,attribute_id,value) VALUES (?,?,0) ON DUPLICATE KEY UPDATE value = VALUES(value)', [personId, powerId], callback)
                },
                function(callback) {
                    query('INSERT INTO person_has_skill (person_id,skill_id,value) VALUES (?,?,0) ON DUPLICATE KEY UPDATE value = VALUES(value)', [personId, skillId], callback)
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send();
            });
        });

    // Milestones

    // Ownership

    router.route('/:personId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.personId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });

    // Protection

    router.route('/:personId/protection')
        .get(function(req, res, next) {
            var call = 'SELECT ' +
                'protection.id, ' +
                'protection.canon, ' +
                'protection.popularity, ' +
                'protection.name, ' +
                'protection.description, ' +
                'protection.price, ' +
                'protection.bodypart_id, ' +
                'protection.icon, ' +
                'person_has_protection.protectionquality_id AS quality_id, ' +
                'protectionquality.price AS quality_price, ' +
                'protectionquality.bonus, ' +
                'person_has_protection.equipped, ' +
                'person_has_protection.custom ' +
                'FROM person_has_protection ' +
                'LEFT JOIN protection ON protection.id = person_has_protection.protection_id ' +
                'LEFT JOIN protectionquality ON protectionquality.id = person_has_protection.protectionquality_id ' +
                'WHERE ' +
                'person_has_protection.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.personId, 'protection', req.body.insert_id, req.body.value);
        });

    router.route('/:personId/protection/:protectionId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.personId, 'protection', req.params.protectionId, req.body.value);
        })
        .delete(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                removeId = parseInt(req.params.protectionId);

            async.each([
                function(callback) {
                    ownership(req, 'person', personId, adminRestriction, callback);
                },
                function(callback) {
                    person.changeEquip(personId, 'protection', removeId, 0, callback);
                },
                function(callback) {
                    query('DELETE FROM person_has_protection WHERE person_id = ? AND protection_id = ?', [personId, removeId], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/protection/:protectionId/equip')
        .put(function(req, res, next) {
            person.changeEquip(req.params.personId, 'protection', req.params.protectionId, 1, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/protection/:protectionId/unequip')
        .put(function(req, res, next) {
            person.changeEquip(req.params.personId, 'protection', req.params.protectionId, 0, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Sanity

    // Skills

    // Software

    // Species

    // Weapons

    // Weapon Mods

    // Wounds


};
