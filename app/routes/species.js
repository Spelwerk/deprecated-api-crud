'use strict';

var async = require('async'),
    yaml = require('node-yaml');

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations');

var sequel = require('../../lib/sql/sequel');

var species = require('../../lib/tables/species'),
    weapons = require('../../lib/tables/weapons');

var defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    var tableName = 'species';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            var sId,
                sName = req.body.name,
                sDescription = req.body.description,
                sIcon = req.body.icon,
                sPlayable = req.body.playable,
                sManifestation = req.body.manifestation,
                sMaxAge = req.body.max_age,
                sMultiplyDoctrine = req.body.multiply_doctrine,
                sMultiplyExpertise = req.body.multiply_expertise,
                sMultiplySkill = req.body.multiply_skill;

            var wName = req.body.weapon || 'Brawl',
                wDescription = 'Unarmed combat for the species: ' + req.body.name,
                wType = defaults.weaponType.unarmed,
                wLegal = 1,
                wPrice = 0,
                wDamageDice = 2,
                wDamageBonus = 0,
                wCriticalDice = 1,
                wCriticalBonus = 0,
                wDistance = 0;

            async.series([
                function(callback) {
                    species.post(req.user, sName, sDescription, sIcon, sPlayable, sManifestation, sMaxAge, sMultiplyDoctrine, sMultiplyExpertise, sMultiplySkill, function(err, id) {
                        if(err) return callback(err);

                        sId = id;

                        callback();
                    })
                },
                function(callback) {
                    weapons.post(req.user, wName, wDescription, wType, wLegal, wPrice, wDamageDice, wDamageBonus, wCriticalDice, wCriticalBonus, wDistance, null, sId, null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: sId});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    // Playable

    router.route('/playable/:playable')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'playable = ?';

            sequel.get(req, res, next, call, [req.params.playable]);
        });

    // ID

    generic.id(router, sql, tableName, false, true);
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
