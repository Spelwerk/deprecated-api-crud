'use strict';

let async = require('async'),
    yaml = require('node-yaml');

let generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    relations = require('../../lib/helper/relations'),
    sequel = require('../../lib/helper/sequel');

let defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    const tableName = 'species';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            let speciesId;

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
                    elemental.post(req.user, req.body, 'species', function(err, id) {
                        if(err) return callback(err);

                        speciesId = id;
                        weapon.species_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, weapon, 'weapon', callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: speciesId});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);

    router.route('/world/:worldId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND ' +
                'world_id = ?';

            sequel.get(req, res, next, call, [req.params.worldId]);
        });

    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
};
