'use strict';

var async = require('async'),
    yaml = require('node-yaml');

var generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    relations = require('../../lib/helper/relations'),
    sequel = require('../../lib/sql/sequel');

var defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    var tableName = 'species',
        options = {
            userOwned: true,
            updatedField: true
        };

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var species = {
                name: req.body.name,
                description: req.body.description,
                icon: req.body.icon,
                playable: req.body.playable,
                manifestation: req.body.manifestation,
                max_age: req.body.max_age,
                multiply_doctrine: req.body.multiply_doctrine,
                multiply_expertise: req.body.multiply_expertise,
                multiply_skill: req.body.multiply_skill
            };

            var weapon = {
                name: req.body.weapon || 'Brawl',
                description: 'Unarmed combat for the species: ' + req.body.name,
                weapontype_id: defaults.weaponType.unarmed,
                legal: true,
                price: 0,
                damage_dice: 2,
                damage_bonus: 0,
                critical_dice: 1,
                critical_bonus: 0,
                distance: 0
            };

            async.series([
                function(callback) {
                    elemental.post(req.user, species, 'species', {userOwned: true}, function(err, id) {
                        if(err) return callback(err);

                        species.id = id;
                        weapon.species_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, weapon, 'weapon', {userOwned: true, combinations: ['species']}, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: species.id});
            });
        });

    generic.deleted(router, tableName, sql);

    router.route('/playable/:playable')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'playable = ?';

            sequel.get(req, res, next, call, [req.params.playable]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.images(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);

    // Relations

    relations(router, tableName, 'attributes', 'attribute');
};
