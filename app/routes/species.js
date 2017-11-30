'use strict';

let async = require('async'),
    yaml = require('node-yaml');

let generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    relations = require('../../lib/helper/relations'),
    sequel = require('../../lib/sql/sequel');

let defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    let tableName = 'species';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            let species = {
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

            let weapon = {
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
                    elemental.post(req.user, species, 'species', null, function(err, id) {
                        if(err) return callback(err);

                        species.id = id;
                        weapon.species_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, weapon, 'weapon', null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: species.id});
            });
        });

    generic.deleted(router, tableName, sql);

    router.route('/playable/:playable')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND ' +
                'playable = ?';

            sequel.get(req, res, next, call, [req.params.playable]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);

    // Relations

    relations(router, tableName, 'attributes', 'attribute');
};
