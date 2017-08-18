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
        'LEFT JOIN person_creation ON person_creation.person_id = person.id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'person.deleted IS NULL';

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
            var call = sql + ' WHERE person.id = ? AND person.deleted IS NULL';

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

    var sqlAssets = 'SELECT ' +
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
        'LEFT JOIN assetgroup ON assetgroup.id = assettype.assetgroup_id';

    router.route('/:personId/assets')
        .get(function(req, res, next) {
            var call = sqlAssets + ' WHERE ' +
                'person_has_asset.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.personId, 'asset', req.body.insert_id, req.body.value);
        });

    router.route('/:personId/assets/:assetId')
        .get(function(req, res, next) {
            var call = sqlAssets + ' WHERE ' +
                'person_has_asset.person_id = ? AND ' +
                'person_has_asset.asset_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.assetId]);
        })
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
            person.changeEquip(req, req.params.personId, 'asset', req.params.assetId, 1, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/assets/:assetId/unequip')
        .put(function(req, res, next) {
            person.changeEquip(req, req.params.personId, 'asset', req.params.assetId, 0, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Attributes

    var sqlAttributes = 'SELECT ' +
        'attribute.id, ' +
        'attribute.canon, ' +
        'attribute.name, ' +
        'attribute.description, ' +
        'attribute.attributetype_id, ' +
        'attribute.icon, ' +
        'attributetype.maximum, ' +
        'person_has_attribute.value ' +
        'FROM person_has_attribute ' +
        'LEFT JOIN attribute ON attribute.id = person_has_attribute.attribute_id ' +
        'LEFT JOIN attributetype ON attributetype.id = attribute.attributetype_id';

    router.route('/:personId/attributes')
        .get(function(req, res, next) {
            var call = sqlAttributes + ' WHERE ' +
                'person_has_attribute.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.personId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:personId/attributes/type/:attributeTypeId')
        .get(function(req, res, next) {
            var call = sqlAttributes + ' WHERE ' +
                'person_has_attribute.person_id = ? AND ' +
                'attribute.attributetype_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.attributeTypeId], true);
        });

    router.route('/:personId/attributes/:attributeId')
        .get(function(req, res, next) {
            var call = sqlAttributes + ' WHERE ' +
                'person_has_attribute.person_id = ? AND ' +
                'person_has_attribute.attribute_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.attributeId], true);
        })
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                attributeId = parseInt(req.params.attributeId),
                attributeValue= parseInt(req.body.value);

            var currentValue;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT value FROM person_has_attribute WHERE person_id = ? AND attribute_id = ?', [personId, attributeId], function(err, result) {
                        if(err) return callback(err);

                        currentValue = !!result[0] ? parseInt(result[0].value) : 0;

                        attributeValue = attributeValue + currentValue;

                        callback();
                    });
                },
                function(callback) {
                    query('UPDATE person_has_attribute SET value = ? WHERE person_id = ? AND attribute_id = ?', [attributeValue, personId, attributeId], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.personId, 'attribute', req.params.attributeId)
        });

    // Augmentations

    var sqlAugmentations = 'SELECT ' +
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
        'LEFT JOIN augmentation ON augmentation.id = person_has_augmentation.augmentation_id';

    router.route('/:personId/augmentations')
        .get(function(req, res, next) {
            var call = sqlAugmentations + ' WHERE ' +
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
                    query('SELECT bionic_id FROM person_has_bionic WHERE person_id = ? AND bionic_id = ?', [personId, bionicId], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0]) return callback({status: 403, message: 'Bionic not on person', error: 'The specified bionic is not in the person list of bionics. Add it before you can add augmentations'});

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT augmentation_id FROM bionic_has_augmentation WHERE bionic_id = ? AND augmentation_id = ?', [bionicId, augmentationId], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0]) return callback({status: 403, message: 'Augmentation not associated with bionic', error: 'The specified augmentation is not associated with that bionic. Did you send the correct insert_id?'});

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO person_has_augmentation (person_id,bionic_id,augmentation_id) VALUES (?,?,?)', [personId, bionicId, augmentationId], callback);
                },
                function(callback) {
                    person.changeActivate(req, personId, augmentationId, bionicId, 1, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:personId/augmentations/bionic/:bionicId')
        .get(function(req, res, next) {
            var call = sqlAugmentations + ' WHERE ' +
                'person_has_augmentation.person_id = ? AND ' +
                'person_has_augmentation.bionic_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.bionicId]);
        });

    router.route('/:personId/augmentations/:augmentationId/bionic/:bionicId')
        .get(function(req, res, next) {
            var call = sqlAugmentations + ' WHERE ' +
                'person_has_augmentation.person_id = ? AND ' +
                'person_has_augmentation.bionic_id = ? AND ' +
                'person_has_augmentation.augmentation_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.bionicId, req.params.augmentationId], true);
        })
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
            person.changeActivate(req, req.params.personId, req.params.augmentationId, req.params.bionicId, 1, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/augmentations/:augmentationId/bionic/:bionicId/deactivate')
        .put(function(req, res, next) {
            person.changeActivate(req, req.params.personId, req.params.augmentationId, req.params.bionicId, 0, function(err) {
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

    var sqlBionics = 'SELECT ' +
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
        'LEFT JOIN bionic ON bionic.id = person_has_bionic.bionic_id';

    router.route('/:personId/bionics')
        .get(function(req, res, next) {
            var call = sqlBionics + ' WHERE ' +
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

                res.status(201).send();
            });
        });

    router.route('/:personId/bionics/:bionicId')
        .get(function(req, res, next) {
            var call = sqlBionics + ' WHERE ' +
                'person_has_bionic.person_id = ? AND ' +
                'person_has_bionic.bionic_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.bionicId], true);
        })
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

                res.status(204).send();
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

    var sqlDiseases = 'SELECT ' +
        'disease.canon, ' +
        'disease.popularity, ' +
        'disease.name, ' +
        'person_has_disease.id, ' +
        'person_has_disease.heal, ' +
        'person_has_disease.timestwo ' +
        'FROM person_has_disease ' +
        'LEFT JOIN disease ON disease.id = person_has_disease.disease_id';

    router.route('/:personId/diseases')
        .get(function(req, res, next) {
            var call = sqlDiseases + ' WHERE ' +
                'person_has_disease.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                diseaseName = req.body.name,
                diseaseTimesTwo = req.body.timestwo || 0;

            var diseaseId;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT id FROM disease WHERE UPPER(name) = ?', [diseaseName.toUpperCase()], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback();

                        diseaseId = result[0].id;

                        callback();
                    });
                },
                function(callback) {
                    if(diseaseId) return callback();

                    query('INSERT INTO disease (name) VALUES (?)', [diseaseName], function(err, result) {
                        if(err) return callback(err);

                        diseaseId = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO person_has_disease (person_id,disease_id,timestwo) VALUES (?,?,?)', [personId, diseaseId, diseaseTimesTwo], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(201).send({id: diseaseId});
            });
        });

    router.route('/:personId/diseases/:diseaseId')
        .get(function(req, res, next) {
            var call = sqlDiseases + ' WHERE ' +
                'person_has_disease.person_id = ? AND ' +
                'person_has_disease.disease_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.diseaseId], true);
        })
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                diseaseId = parseInt(req.params.diseaseId),
                diseaseHeal = parseInt(req.body.heal);

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('UPDATE person_has_disease SET heal = ? WHERE person_id = ? AND disease_id = ?', [diseaseHeal, personId, diseaseId], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.personId, 'disease', req.params.diseaseId);
        });

    // Doctrines

    var sqlDoctrines = 'SELECT ' +
        'doctrine.id, ' +
        'doctrine.canon, ' +
        'doctrine.popularity, ' +
        'doctrine.name, ' +
        'doctrine.description, ' +
        'doctrine.manifestation_id, ' +
        'doctrine.expertise_id, ' +
        'doctrine.icon,  ' +
        'person_has_doctrine.value ' +
        'FROM person_has_doctrine ' +
        'LEFT JOIN doctrine ON doctrine.id = person_has_doctrine.doctrine_id';

    router.route('/:personId/doctrines')
        .get(function(req, res, next) {
            var call = sqlDoctrines + ' WHERE ' +
                'person_has_doctrine.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                doctrineId = parseInt(req.body.insert_id),
                doctrineValue = parseInt(req.body.value);

            var manifestationId;

            async.series([
                function(callback) {
                    if(doctrineValue < 1) return callback();

                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    if(doctrineValue < 1) return callback();

                    query('SELECT manifestation_id FROM person_playable WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0].manifestation_id) return callback({status: 403, message: 'Forbidden', error: 'Person does not have a manifestation'});

                        manifestationId = results[0].manifestation_id;

                        callback();
                    });
                },
                function(callback) {
                    if(doctrineValue < 1) return callback();

                    query('SELECT id FROM doctrine WHERE id = ? AND manifestation_id = ?', [doctrineId, manifestationId], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0].id) return callback({status: 403, message: 'Forbidden', error: 'The doctrine is not included in the person manifestation'});

                        callback();
                    });
                },
                function(callback) {
                    if(doctrineValue < 1) return callback();

                    query('INSERT INTO person_has_doctrine (person_id,doctrine_id,value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [personId, doctrineId, doctrineValue], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/doctrines/:doctrineId')
        .get(function(req, res, next) {
            var call = sqlDoctrines + ' WHERE ' +
                'person_has_doctrine.person_id = ? AND ' +
                'person_has_doctrine.doctrine_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.doctrineId], true);
        })
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                doctrineId = parseInt(req.params.doctrineId),
                doctrineValue = parseInt(req.body.value);

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT value FROM person_has_doctrine WHERE person_id = ? AND doctrine_id = ?', [personId, doctrineId], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0].value) return callback({status: 403, message: 'Forbidden', error: 'The person has not added this doctrine yet'});

                        doctrineValue = doctrineValue + parseInt(results[0].value);

                        callback();
                    });
                },
                function(callback) {
                    if(doctrineValue < 1) return callback();

                    query('UPDATE person_has_doctrine SET value = ? WHERE person_id = ? AND doctrine_id = ?', [doctrineValue, personId, doctrineId], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.personId, 'doctrine', req.params.doctrineId);
        });

    // Expertises

    var sqlExpertises = 'SELECT ' +
        'expertise.id, ' +
        'expertise.canon, ' +
        'expertise.popularity, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'expertise.skill_id, ' +
        'expertise.species_id, ' +
        'expertise.manifestation_id, ' +
        'skill.icon, ' +
        'person_has_expertise.value, ' +
        'person_has_skill.value AS bonus ' +
        'FROM person_has_expertise ' +
        'LEFT JOIN expertise ON expertise.id = person_has_expertise.expertise_id ' +
        'LEFT JOIN skill ON skill.id = expertise.skill_id ' +
        'LEFT JOIN person_has_skill ON person_has_skill.person_id = ? AND person_has_skill.skill_id = expertise.skill_id';

    router.route('/:personId/expertises')
        .get(function(req, res, next) {
            var call = sqlExpertises + ' WHERE ' +
                'person_has_expertise.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.personId]); // personId used twice for LEFT JOIN person_has_skill
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                expertiseId = parseInt(req.body.insert_id),
                expertiseValue = parseInt(req.body.value);

            async.series([
                function(callback) {
                    if(expertiseValue < 1) return callback();

                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    if(expertiseValue < 1) return callback();

                    query('INSERT INTO person_has_expertise (person_id,expertise_id,value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [personId, expertiseId, expertiseValue], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/expertises/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sqlExpertises + ' WHERE ' +
                'person_has_expertise.person_id = ? AND ' +
                'expertise.manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.personId, req.params.manifestationId]); // personId used twice for LEFT JOIN person_has_skill
        });

    router.route('/:personId/expertises/:expertiseId')
        .get(function(req, res, next) {
            var call = sqlExpertises + ' WHERE ' +
                'person_has_expertise.person_id = ? AND ' +
                'person_has_expertise.expertise_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.personId, req.params.expertiseId], true); // personId used twice for LEFT JOIN person_has_skill
        })
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                expertiseId = parseInt(req.params.expertiseId),
                expertiseValue = parseInt(req.body.value);

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT value FROM person_has_expertise WHERE person_id = ? AND expertise_id = ?', [personId, expertiseId], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0].value) return callback({status: 403, message: 'Forbidden', error: 'The person has not added this expertise yet'});

                        expertiseValue = expertiseValue + parseInt(results[0].value);

                        callback();
                    });
                },
                function(callback) {
                    if(expertiseValue < 1) return callback();

                    query('INSERT INTO person_has_expertise (person_id,expertise_id,value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [personId, expertiseId, expertiseValue], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.personId, 'expertise', req.params.expertiseId);
        });

    // Gifts

    var sqlGifts = 'SELECT * FROM person_has_gift ' +
        'LEFT JOIN gift ON gift.id = person_has_gift.gift_id';

    router.route('/:personId/gifts')
        .get(function(req, res, next) {
            var call = sqlGifts + ' WHERE ' +
                'person_has_gift.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                giftId = parseInt(req.body.insert_id);

            var personArray,
                giftArray;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('INSERT INTO person_has_gift (person_id,gift_id) VALUES (?,?)', [personId, giftId], callback);
                },

                // ATTRIBUTE

                function(callback) {
                    query('SELECT attribute_id as id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT attribute_id as id, value FROM gift_has_attribute WHERE gift_id = ?', [giftId], function(err, results) {
                        if(err) return callback(err);

                        giftArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('attribute', personId, personArray, giftArray, null, callback);
                },

                // SKILL

                function(callback) {
                    query('SELECT skill_id as id, value FROM person_has_skill WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT skill_id as id, value FROM gift_has_skill WHERE gift_id = ?', [giftId], function(err, results) {
                        if(err) return callback(err);

                        giftArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('skill', personId, personArray, giftArray, null, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/gifts/:giftId')
        .get(function(req, res, next) {
            var call = sqlGifts + ' WHERE ' +
                'person_has_gift.person_id = ? AND ' +
                'person_has_gift.gift_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.giftId], true);
        })
        .delete(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                giftId = parseInt(req.params.giftId);

            var personArray,
                giftArray;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('DELETE FROM person_has_gift WHERE person_id = ? AND gift_id = ?', [personId, giftId], callback);
                },

                // ATTRIBUTE

                function(callback) {
                    query('SELECT attribute_id as id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT attribute_id as id, value FROM gift_has_attribute WHERE gift_id = ?', [giftId], function(err, results) {
                        if(err) return callback(err);

                        giftArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('attribute', personId, personArray, null, giftArray, callback);
                },

                // SKILL

                function(callback) {
                    query('SELECT skill_id as id, value FROM person_has_skill WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT skill_id as id, value FROM gift_has_skill WHERE gift_id = ?', [giftId], function(err, results) {
                        if(err) return callback(err);

                        giftArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('skill', personId, personArray, null, giftArray, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Imperfections

    var sqlImperfections = 'SELECT * FROM person_has_imperfection ' +
        'LEFT JOIN imperfection ON imperfection.id = person_has_imperfection.imperfection_id';

    router.route('/:personId/imperfections')
        .get(function(req, res, next) {
            var call = sqlImperfections + ' WHERE ' +
                'person_has_imperfection.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                imperfectionId = parseInt(req.body.insert_id);

            var personArray,
                imperfectionArray;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('INSERT INTO person_has_imperfection (person_id,imperfection_id) VALUES (?,?)', [personId, imperfectionId], callback);
                },

                // ATTRIBUTE

                function(callback) {
                    query('SELECT attribute_id as id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT attribute_id as id, value FROM imperfection_has_attribute WHERE imperfection_id = ?', [imperfectionId], function(err, results) {
                        if(err) return callback(err);

                        imperfectionArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('attribute', personId, personArray, imperfectionArray, null, callback);
                },

                // SKILL

                function(callback) {
                    query('SELECT skill_id as id, value FROM person_has_skill WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT skill_id as id, value FROM imperfection_has_skill WHERE imperfection_id = ?', [imperfectionId], function(err, results) {
                        if(err) return callback(err);

                        imperfectionArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('skill', personId, personArray, imperfectionArray, null, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/imperfections/:imperfectionId')
        .get(function(req, res, next) {
            var call = sqlImperfections + ' WHERE ' +
                'person_has_imperfection.person_id = ? AND ' +
                'person_has_imperfection.imperfection_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.imperfectionId], true);
        })
        .delete(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                imperfectionId = parseInt(req.params.imperfectionId);

            var personArray,
                imperfectionArray;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('DELETE FROM person_has_imperfection WHERE person_id = ? AND imperfection_id = ?', [personId, imperfectionId], callback);
                },

                // ATTRIBUTE

                function(callback) {
                    query('SELECT attribute_id as id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT attribute_id as id, value FROM imperfection_has_attribute WHERE imperfection_id = ?', [imperfectionId], function(err, results) {
                        if(err) return callback(err);

                        imperfectionArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('attribute', personId, personArray, null, imperfectionArray, callback);
                },

                // SKILL

                function(callback) {
                    query('SELECT skill_id as id, value FROM person_has_skill WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT skill_id as id, value FROM imperfection_has_skill WHERE imperfection_id = ?', [imperfectionId], function(err, results) {
                        if(err) return callback(err);

                        imperfectionArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('skill', personId, personArray, null, imperfectionArray, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Manifestation

    router.route('/:personId/manifestation')
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                manifestationId = parseInt(req.body.insert_id),
                powerId,
                skillId;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT manifestation_id FROM person_playable WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        if(!!results[0].manifestation_id) return callback({status: 403, message: 'Forbidden', error: 'You may not change the manifestation for persons'});

                        callback();
                    })
                },
                function(callback) {
                    query('UPDATE person_playable SET manifestation_id = ? WHERE person_id = ?', [manifestationId, personId], callback);
                },
                function(callback) {
                    query('SELECT power_id, skill_id FROM manifestation WHERE id = ?', [manifestationId], function(err, results) {
                        if(err) return callback(err);

                        powerId = results[0].power_id;
                        skillId = results[0].skill_id;

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

                res.status(204).send();
            });
        });

    // Milestones

    var sqlMilestones = 'SELECT * FROM person_has_milestone ' +
        'LEFT JOIN milestone ON milestone.id = person_has_milestone.milestone_id';

    router.route('/:personId/milestones')
        .get(function(req, res, next) {
            var call = sqlMilestones + ' WHERE ' +
                'person_has_milestone.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                milestoneId = parseInt(req.body.insert_id);

            var personArray,
                milestoneArray;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('INSERT INTO person_has_milestone (person_id,milestone_id) VALUES (?,?)', [personId, milestoneId], callback);
                },

                // ATTRIBUTE

                function(callback) {
                    query('SELECT attribute_id as id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT attribute_id as id, value FROM milestone_has_attribute WHERE milestone_id = ?', [milestoneId], function(err, results) {
                        if(err) return callback(err);

                        milestoneArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('attribute', personId, personArray, milestoneArray, null, callback);
                },

                // SKILL

                function(callback) {
                    query('SELECT skill_id as id, value FROM person_has_skill WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT skill_id as id, value FROM milestone_has_skill WHERE milestone_id = ?', [milestoneId], function(err, results) {
                        if(err) return callback(err);

                        milestoneArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('skill', personId, personArray, milestoneArray, null, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/milestones/:milestoneId')
        .get(function(req, res, next) {
            var call = sqlMilestones + ' WHERE ' +
                'person_has_milestone.person_id = ? AND ' +
                'person_has_milestone.milestone_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.milestoneId], true);
        })
        .delete(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                milestoneId = parseInt(req.params.milestoneId);

            var personArray,
                milestoneArray;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('DELETE FROM person_has_milestone WHERE person_id = ? AND milestone_id = ?', [personId, milestoneId], callback);
                },

                // ATTRIBUTE

                function(callback) {
                    query('SELECT attribute_id as id, value FROM person_has_attribute WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT attribute_id as id, value FROM milestone_has_attribute WHERE milestone_id = ?', [milestoneId], function(err, results) {
                        if(err) return callback(err);

                        milestoneArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('attribute', personId, personArray, null, milestoneArray, callback);
                },

                // SKILL

                function(callback) {
                    query('SELECT skill_id as id, value FROM person_has_skill WHERE person_id = ?', [personId], function(err, results) {
                        if(err) return callback(err);

                        personArray = results;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT skill_id as id, value FROM milestone_has_skill WHERE milestone_id = ?', [milestoneId], function(err, results) {
                        if(err) return callback(err);

                        milestoneArray = results;

                        callback();
                    });
                },
                function(callback) {
                    person.changeValues('skill', personId, personArray, null, milestoneArray, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
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

    // Protection

    var sqlProtection = 'SELECT ' +
        'protection.id, ' +
        'protection.canon, ' +
        'protection.popularity, ' +
        'protection.name, ' +
        'protection.description, ' +
        'protection.price, ' +
        'protection.bodypart_id, ' +
        'protection.icon, ' +
        'person_has_protection.equipped, ' +
        'person_has_protection.custom ' +
        'FROM person_has_protection ' +
        'LEFT JOIN protection ON protection.id = person_has_protection.protection_id';

    router.route('/:personId/protection')
        .get(function(req, res, next) {
            var call = sqlProtection + ' WHERE ' +
                'person_has_protection.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.personId, 'protection', req.body.insert_id);
        });

    router.route('/:personId/protection/:protectionId')
        .get(function(req, res, next) {
            var call = sqlProtection + ' WHERE ' +
                'person_has_protection.person_id = ? AND ' +
                'person_has_protection.protection_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.protectionId], true);
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
            person.changeEquip(req, req.params.personId, 'protection', req.params.protectionId, 1, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:personId/protection/:protectionId/unequip')
        .put(function(req, res, next) {
            person.changeEquip(req, req.params.personId, 'protection', req.params.protectionId, 0, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Sanity

    var sqlSanity = 'SELECT ' +
        'sanity.canon, ' +
        'sanity.popularity, ' +
        'sanity.name, ' +
        'person_has_sanity.id, ' +
        'person_has_sanity.heal, ' +
        'person_has_sanity.timestwo ' +
        'FROM person_has_sanity ' +
        'LEFT JOIN sanity ON sanity.id = person_has_sanity.sanity_id';

    router.route('/:personId/sanity')
        .get(function(req, res, next) {
            var call = sqlSanity + ' WHERE ' +
                'person_has_sanity.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                sanityName = req.body.name,
                sanityTimesTwo = req.body.timestwo || 0;

            var sanityId;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT id FROM sanity WHERE UPPER(name) = ?', [sanityName.toUpperCase()], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback();

                        sanityId = result[0].id;

                        callback();
                    });
                },
                function(callback) {
                    if(sanityId) return callback();

                    query('INSERT INTO sanity (name) VALUES (?)', [sanityName], function(err, result) {
                        if(err) return callback(err);

                        sanityId = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO person_has_sanity (person_id,sanity_id,timestwo) VALUES (?,?,?)', [personId, sanityId, sanityTimesTwo], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(201).send({id: sanityId});
            });
        });

    router.route('/:personId/sanity/:sanityId')
        .get(function(req, res, next) {
            var call = sqlSanity + ' WHERE ' +
                'person_has_sanity.person_id = ? AND ' +
                'person_has_sanity.sanity_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.sanityId], true);
        })
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                sanityId = parseInt(req.params.sanityId),
                sanityHeal = parseInt(req.body.heal);

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('UPDATE person_has_sanity SET heal = ? WHERE person_id = ? AND sanity_id = ?', [sanityHeal, personId, sanityId], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.personId, 'sanity', req.params.sanityId);
        });

    // Skills //todo

    router.route('/:personId/imperfections')
        .get(function(req, res, next) {})
        .post(function(req, res, next) {});

    router.route('/:personId/imperfections/:imperfectionId')
        .get(function(req, res, next) {})
        .put(function(req, res, next) {})
        .delete(function(req, res, next) {});

    // Software //todo

    router.route('/:personId/imperfections')
        .get(function(req, res, next) {})
        .post(function(req, res, next) {});

    router.route('/:personId/imperfections/:imperfectionId')
        .get(function(req, res, next) {})
        .put(function(req, res, next) {})
        .delete(function(req, res, next) {});

    // Species //todo

    router.route('/:personId/imperfections')
        .get(function(req, res, next) {})
        .post(function(req, res, next) {});

    router.route('/:personId/imperfections/:imperfectionId')
        .get(function(req, res, next) {})
        .put(function(req, res, next) {})
        .delete(function(req, res, next) {});

    // Weapons //todo

    router.route('/:personId/imperfections')
        .get(function(req, res, next) {})
        .post(function(req, res, next) {});

    router.route('/:personId/imperfections/:imperfectionId')
        .get(function(req, res, next) {})
        .put(function(req, res, next) {})
        .delete(function(req, res, next) {});

    // Weapon Mods //todo

    router.route('/:personId/imperfections')
        .get(function(req, res, next) {})
        .post(function(req, res, next) {});

    router.route('/:personId/imperfections/:imperfectionId')
        .get(function(req, res, next) {})
        .put(function(req, res, next) {})
        .delete(function(req, res, next) {});

    // Wounds

    var sqlWounds = 'SELECT ' +
        'wound.canon, ' +
        'wound.popularity, ' +
        'wound.name, ' +
        'person_has_wound.id, ' +
        'person_has_wound.heal, ' +
        'person_has_wound.timestwo, ' +
        'FROM person_has_wound ' +
        'LEFT JOIN wound ON wound.id = person_has_wound.wound_id';

    router.route('/:personId/wounds')
        .get(function(req, res, next) {
            var call = sqlWounds + ' WHERE ' +
                'person_has_wound.person_id = ?';

            sequel.get(req, res, next, call, [req.params.personId]);
        })
        .post(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                woundName = req.body.name,
                woundTimesTwo = req.body.timestwo || 0;

            var woundId;

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('SELECT id FROM wound WHERE UPPER(name) = ?', [woundName.toUpperCase()], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback();

                        woundId = result[0].id;

                        callback();
                    });
                },
                function(callback) {
                    if(woundId) return callback();

                    query('INSERT INTO wound (name) VALUES (?)', [woundName], function(err, result) {
                        if(err) return callback(err);

                        woundId = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO person_has_wound (person_id,wound_id,timestwo) VALUES (?,?,?)', [personId, woundId, woundTimesTwo], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(201).send({id: woundId});
            });
        });

    router.route('/:personId/wounds/:woundId')
        .get(function(req, res, next) {
            var call = sqlWounds + ' WHERE ' +
                'person_has_wound.person_id = ? AND ' +
                'person_has_wound.wound_id = ?';

            sequel.get(req, res, next, call, [req.params.personId, req.params.woundId], true);
        })
        .put(function(req, res, next) {
            var personId = parseInt(req.params.personId),
                woundId = parseInt(req.params.woundId),
                woundHeal = parseInt(req.body.heal);

            async.series([
                function(callback) {
                    ownership(req, tableName, personId, adminRestriction, callback);
                },
                function(callback) {
                    query('UPDATE person_has_wound SET heal = ? WHERE person_id = ? AND wound_id = ?', [woundHeal, personId, woundId], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.personId, 'wound', req.params.woundId);
        });
};
