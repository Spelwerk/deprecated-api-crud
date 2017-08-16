var async = require('async'),
    yaml = require('node-yaml');

var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    query = require('./../../lib/sql/query'),
    sequel = require('./../../lib/sql/sequel');

var defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    'use strict';

    var tableName = 'species',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM species';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'species.canon = 1 AND ' +
                'species.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User ID missing.'});

            var insert = {};

            insert.name = req.body.name;
            insert.description = req.body.description;
            insert.playable = req.body.playable;
            insert.max_age = req.body.max_age;
            insert.multiply_skill = req.body.multiply_skill;
            insert.multiply_expertise = req.body.multiply_expertise;
            insert.icon = req.body.icon;
            insert.affected = 0;

            async.series([
                function(callback) {
                    query('INSERT INTO species (name,description,playable,max_age,multiply_skill,multiply_expertise,icon) VALUES (?,?,?,?,?,?,?)', [insert.name, insert.description, insert.playable, insert.max_age, insert.multiply_skill, insert.multiply_expertise, insert.icon], function(err, result) {
                        if(err) return callback(err);

                        insert.id = result.insertId;
                        insert.affected += result.affectedRows;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO species_has_weapon (species_id,weapon_id) VALUES (?,?)', [insert.id, defaults.weapon.default], function(err, result) {
                        if(err) return callback(err);

                        insert.affected += result.affectedRows;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_has_species (user_id,species_id,owner) VALUES (?,?,1)', [req.user.id, insert.id], callback);
                }
            ],function(err) {
                if(err) return next(err);

                var message = 'Created new row in species';

                res.status(201).send({success: true, message: message, affected: insert.affected, id: insert.id});
            });
        });

    // Creature

    router.route('/creature')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'species.canon = 1 AND ' +
                'species.playable = 0 AND ' +
                'species.deleted IS NULL';

            sequel.get(req, res, next, call);
        });

    // Playable

    router.route('/playable')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'species.canon = 1 AND ' +
                'species.playable = 1 AND ' +
                'species.deleted IS NULL';

            sequel.get(req, res, next, call);
        });

    // ID

    router.route('/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE species.id = ? AND species.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.speciesId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.speciesId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.speciesId, adminRestriction);
        });

    router.route('/:speciesId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.speciesId, useUpdateColumn);
        });

    router.route('/:speciesId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.speciesId, adminRestriction, userContent);
        });

    router.route('/:speciesId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.speciesId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.speciesId);
        });

    router.route('/:speciesId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.speciesId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });

    // Attribute List

    router.route('/:speciesId/attributes')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM species_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = species_has_attribute.attribute_id ' +
                'WHERE ' +
                'species_has_attribute.species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.speciesId, 'attribute', req.body.insert_id, req.body.value);
        });

    router.route('/:speciesId/attributes/:attributeId')
        .put(function(req, res, next) {
            relation.put(req, res, next, tableName, req.params.speciesId, 'attribute', req.params.attributeId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.speciesId, 'attribute', req.params.attributeId);
        });

    // Skill List

    router.route('/:speciesId/weapons')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM species_has_weapon ' +
                'LEFT JOIN weapon ON weapon.id = species_has_weapon.weapon_id ' +
                'WHERE ' +
                'species_has_weapon.species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.speciesId, 'weapon', req.body.insert_id);
        });

    router.route('/:speciesId/weapons/:weaponId')
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.speciesId, 'weapon', req.params.weaponId);
        });
};
